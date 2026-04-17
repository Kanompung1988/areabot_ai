FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y gcc && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

COPY . .

RUN useradd -m -r appuser
USER appuser

EXPOSE 8000
ENTRYPOINT ["sh", "./entrypoint.sh"]
