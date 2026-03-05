"""
RAG (Retrieval-Augmented Generation) service.
Handles document processing, embedding, and retrieval.
"""
import logging
from typing import Optional
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
