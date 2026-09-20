import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # OpenAI Settings
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # ChromaDB Settings
    CHROMA_PERSIST_DIRECTORY: str = str(BASE_DIR / "chroma_db")
    COLLECTION_NAME: str = "conversational_rag_docs"

    # Ingestion / Chunking
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150

    # Retrieval
    TOP_K: int = 4
    SIMILARITY_THRESHOLD: float = 0.0

    # Memory & Summarization
    MAX_RECENT_MESSAGES: int = 6  # 3 user-assistant pairs
    SUMMARY_TRIGGER: int = 6      # Trigger summary generation when total turns >= this count
    MAX_CONTEXT_TOKENS: int = 3000
    SUMMARY_MAX_TOKENS: int = 500

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

settings = Settings()
