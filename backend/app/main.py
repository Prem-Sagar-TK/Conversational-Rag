import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api import documents, conversations, chat
from app.models.schemas import HealthResponse
from app.vectorstore.chroma import get_vector_store

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("conversational_rag")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown."""
    logger.info("Starting Conversational RAG API Server...")
    try:
        # Initialize vector store on startup
        vs = get_vector_store()
        logger.info(f"Vector Store initialized with {vs.get_total_chunks()} chunks.")
    except Exception as e:
        logger.error(f"Failed to initialize Chroma vector store on startup: {str(e)}")
    yield
    logger.info("Shutting down Conversational RAG API Server...")

app = FastAPI(
    title="Conversational RAG API",
    description="Production Conversational Retrieval-Augmented Generation API with Query Rewriting & Bounded Memory",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(conversations.router)

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint to verify vector DB status and configuration."""
    try:
        vector_store = get_vector_store()
        total_chunks = vector_store.get_total_chunks()
        indexed_docs = vector_store.list_indexed_documents()
        v_status = "connected"
    except Exception as e:
        logger.error(f"Health check failed to query vector store: {str(e)}")
        v_status = "error"
        total_chunks = 0
        indexed_docs = []

    openai_ok = bool(settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("your_openai_api_key"))

    return HealthResponse(
        status="healthy",
        vector_db_status=v_status,
        document_count=len(indexed_docs),
        total_chunk_count=total_chunks,
        openai_configured=openai_ok
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please check server logs for details."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
