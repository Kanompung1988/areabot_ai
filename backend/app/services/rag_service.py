"""
RAG (Retrieval-Augmented Generation) service.
Handles document processing, embedding, and retrieval.
"""
import io
import logging
from typing import Optional
import yaml
from openai import AsyncOpenAI
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import get_settings
from app import models

logger = logging.getLogger(__name__)
settings = get_settings()

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
EMBEDDING_DIMS = 1536  # text-embedding-3-small


def chunk_text(content: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    if not content:
        return []
    words = content.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += chunk_size - overlap
    return chunks


async def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings using OpenAI text-embedding-3-small."""
    if not texts:
        return []
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in response.data]


async def process_document(doc_id: str, content: str, db: Session):
    """Process a document: chunk it, generate embeddings, store in DB."""
    chunks = chunk_text(content)
    if not chunks:
        return

    embeddings = await generate_embeddings(chunks)

    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        db_chunk = models.KnowledgeChunk(
            document_id=doc_id,
            content=chunk,
            chunk_index=i,
            embedding=embedding,
        )
        db.add(db_chunk)

    doc = db.query(models.KnowledgeDocument).filter(
        models.KnowledgeDocument.id == doc_id
    ).first()
    if doc:
        doc.chunk_count = len(chunks)
        doc.status = "ready"

    db.commit()


async def retrieve_context(bot_id: str, query: str, db: Session, top_k: int = 5) -> str:
    """Retrieve relevant knowledge chunks for a query using vector similarity."""
    docs = db.query(models.KnowledgeDocument).filter(
        models.KnowledgeDocument.bot_id == bot_id,
        models.KnowledgeDocument.status == "ready",
    ).all()

    if not docs:
        return ""

    doc_ids = [d.id for d in docs]

    query_embedding = await generate_embeddings([query])
    if not query_embedding:
        return ""

    # Use pgvector native <=> (cosine distance) operator
    # Vector column type handles serialization automatically
    query_vec = query_embedding[0]
    embedding_literal = "[" + ",".join(str(x) for x in query_vec) + "]"

    result = db.execute(
        text("""
            SELECT content,
                   1 - (embedding <=> CAST(:query_embedding AS vector)) AS similarity
            FROM knowledge_chunks
            WHERE document_id = ANY(:doc_ids)
              AND embedding IS NOT NULL
            ORDER BY embedding <=> CAST(:query_embedding AS vector)
            LIMIT :top_k
        """),
        {
            "query_embedding": embedding_literal,
            "doc_ids": doc_ids,
            "top_k": top_k,
        }
    )

    chunks = result.fetchall()
    if not chunks:
        return ""

    context_parts = [chunk.content for chunk in chunks if chunk.similarity > 0.3]
    return "\n\n".join(context_parts)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes."""
    from pypdf import PdfReader
    import io
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text_parts.append(t)
    return "\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX bytes."""
    from docx import Document
    import io
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text_from_yaml(file_bytes: bytes) -> str:
    """Extract text from YAML knowledge-base files (Tobtan-Clinic-AI format).

    Supported YAML schemas:
    - pricing.yaml  → entries[].service + entries[].variants[]
    - services.yaml → entries[].name + entries[].description ...
    - faq.yaml      → entries[].question + entries[].answer
    - promotions.yaml → entries[].title + entries[].detail ...
    - generic        → all key/value pairs flattened

    Returns a single human-readable Thai text string ready for chunking.
    """
    try:
        data = yaml.safe_load(file_bytes.decode("utf-8", errors="ignore"))
    except yaml.YAMLError as e:
        logger.warning(f"YAML parse error: {e}")
        return ""

    if not isinstance(data, dict):
        return str(data)

    entries = data.get("entries", [])
    if not entries:
        # Try top-level list
        if isinstance(data, list):
            entries = data
        else:
            # Fallback: dump all key-value pairs
            return "\n".join(f"{k}: {v}" for k, v in data.items())

    # Detect schema type from first entry keys
    first = entries[0] if entries else {}
    lines: list[str] = []

    for entry in entries:
        if "question" in entry and "answer" in entry:
            # FAQ schema
            lines.append(f"คำถาม: {entry.get('question', '')}")
            lines.append(f"คำตอบ: {entry.get('answer', '')}")

        elif "service" in entry and "variants" in entry:
            # Pricing schema
            lines.append(f"บริการ: {entry.get('service', '')}")
            for v in entry.get("variants", []):
                price = v.get("price_thb", "")
                note = v.get("note", "")
                price_str = f"{price:,} บาท" if isinstance(price, int) else f"{price} บาท"
                vline = f"  - {v.get('name', '')}: {price_str}"
                if note:
                    vline += f" ({note})"
                lines.append(vline)

        elif "title" in entry and ("detail" in entry or "price_thb" in entry):
            # Promotions schema
            lines.append(f"โปรโมชั่น: {entry.get('title', '')}")
            if entry.get("detail"):
                lines.append(f"รายละเอียด: {entry['detail']}")
            price = entry.get("price_thb", "")
            if price:
                price_str = f"{price:,} บาท" if isinstance(price, int) else f"{price} บาท"
                lines.append(f"ราคา: {price_str}")
            if entry.get("valid_until"):
                lines.append(f"ถึงวันที่: {entry['valid_until']}")

        elif "name" in entry and "description" in entry:
            # Services schema
            lines.append(f"บริการ: {entry.get('name', '')}")
            lines.append(f"รายละเอียด: {entry.get('description', '')}")
            if entry.get("duration"):
                lines.append(f"ระยะเวลา: {entry['duration']}")
            if entry.get("suitable_for"):
                lines.append(f"เหมาะสำหรับ: {entry['suitable_for']}")

        else:
            # Generic fallback
            lines.append("\n".join(f"{k}: {v}" for k, v in entry.items()))

        lines.append("")  # blank separator between entries

    return "\n".join(lines).strip()


async def crawl_url(url: str) -> str:
    """Crawl a URL and extract text content."""
    import httpx
    from bs4 import BeautifulSoup
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)
