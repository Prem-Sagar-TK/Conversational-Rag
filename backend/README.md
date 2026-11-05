# Conversational RAG — Backend API Server

The backend service for the **Conversational Retrieval-Augmented Generation (RAG)** platform, implemented with **FastAPI**, **LangChain**, **ChromaDB**, and **OpenAI API**.

Unlike naive single-turn RAG systems that execute literal semantic searches on every prompt, this backend implements a **Contextual Query-Rewriting Chain** and **Bounded, Self-Summarizing Conversation Memory**.

---

## 🏛️ Module Overview

```text
app/
├── api/
│   ├── chat.py                # POST /api/chat: Contextual rewrite, retrieval, and generation
│   ├── conversations.py       # CRUD endpoints for multi-turn conversation sessions
│   └── documents.py           # Document upload, parsing, chunking, and deletion
├── memory/
│   ├── conversation_memory.py # Bounded sliding-window history manager
│   └── summarizer.py          # Progressive background summarizer for long sessions
├── models/
│   └── schemas.py             # Pydantic v2 schemas for requests, responses, and errors
├── rag/
│   ├── answer_generator.py    # Grounded answer synthesis with source citation formatting
│   ├── ingestion.py           # Multi-format document parser (PDF, DOCX, TXT, MD)
│   ├── prompts.py             # System prompts for query rewriting and answer generation
│   ├── query_rewriter.py      # LLM chain that resolves pronouns into standalone queries
│   └── retriever.py           # Vector search abstraction layer with similarity scoring
├── vectorstore/
│   └── chroma.py              # Persistent ChromaDB client and embedding adapter
├── config.py                  # Pydantic BaseSettings loading from .env
└── main.py                    # FastAPI application initialization, CORS, and lifespan
```

---

## ⚙️ Environment Variables

Create a `backend/.env` file based on `backend/.env.example`:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `OPENAI_API_KEY` | `string` | *(Required)* | OpenAI API key for embeddings and generation |
| `OPENAI_MODEL` | `string` | `gpt-4o-mini` | LLM model for rewriting and generation |
| `EMBEDDING_MODEL` | `string` | `text-embedding-3-small` | Vector embedding model |
| `CHROMA_PERSIST_DIRECTORY` | `string` | `./chroma_db` | Storage path for Chroma vector database |
| `CHUNK_SIZE` | `int` | `1000` | Target character length per chunk |
| `CHUNK_OVERLAP` | `int` | `150` | Overlap between adjacent chunks |
| `TOP_K` | `int` | `4` | Number of document chunks retrieved per turn |
| `MAX_RECENT_MESSAGES` | `int` | `6` | Maximum sliding window turns kept uncompressed |
| `SUMMARY_TRIGGER` | `int` | `6` | Threshold of turns before summarization triggers |

---

## 🚀 Running the Server

### 1. Set Up Virtual Environment
```bash
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Launch with Uvicorn
```bash
python -m uvicorn app.main:app --reload --port 8000
```

Interactive OpenAPI Swagger documentation is available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 Key REST Endpoints

### 1. Document Ingestion
- `POST /api/documents/upload`: Uploads a document (multipart/form-data), extracts text, chunks it, and writes vector embeddings to ChromaDB.
- `GET /api/documents`: Returns all indexed documents and chunk statistics.
- `DELETE /api/documents/{document_id}`: Removes a document and wipes its chunks from the vector store.

### 2. Conversational Chat
- `POST /api/chat`: Executes query rewriting against active session history, retrieves top-$k$ context chunks, generates an answer with citations, and updates conversation memory.

### 3. Session Lifecycle
- `POST /api/conversations`: Initializes a new conversation session.
- `GET /api/conversations`: Lists all conversations.
- `GET /api/conversations/{conversation_id}`: Retrieves full session state, summary, and message history.
- `DELETE /api/conversations/{conversation_id}`: Deletes a conversation session.

### 4. Health Check
- `GET /api/health`: Validates ChromaDB connectivity, loaded chunk count, and model configuration.

