# Conversational RAG — Automated Test Suite

A comprehensive test suite built with **pytest** and **FastAPI TestClient** validating end-to-end correctness across ingestion, vector retrieval, contextual query rewriting, bounded memory, and REST API endpoints.

---

## 🧪 Test Suite Structure

| Test File | Focus Area | Description |
| :--- | :--- | :--- |
| [`test_api.py`](./test_api.py) | **REST API & Endpoints** | Tests health checks, conversation lifecycle (CRUD), document upload endpoints, and chat execution workflows. |
| [`test_ingestion.py`](./test_ingestion.py) | **Document Parsing & Chunking** | Verifies text extraction across PDF, TXT, DOCX, and Markdown, clean chunk generation, and metadata attachment. |
| [`test_retrieval.py`](./test_retrieval.py) | **Vector Store & Retrieval** | Validates ChromaDB persistence, top-$k$ similarity queries, score thresholding, document deletion, and citation extraction. |
| [`test_query_rewriting.py`](./test_query_rewriting.py) | **Contextual Rewriter** | Confirms pronoun resolution (*"it"*, *"that"*), follow-up question expansion, and preservation of standalone queries. |
| [`test_memory.py`](./test_memory.py) | **Memory Management** | Tests bounded sliding window (`MAX_RECENT_MESSAGES`), threshold-triggered progressive summarization, and state retention. |
| [`conftest.py`](./conftest.py) | **Fixtures & Test Config** | Provides shared test fixtures, mock embedding adapters, temporary Chroma test directories, and sample documents. |

---

## 🚀 Running the Tests

Make sure your virtual environment is active, then run:

### Run All Tests
```bash
pytest tests/ -v
```

### Run a Specific Test Module
```bash
pytest tests/test_api.py -v
```

### Run with Short Tracebacks and Execution Timings
```bash
pytest tests/ -v --tb=short --durations=5
```

---

## 🛡️ Testing Architecture & Mocking Strategy

- **Isolated Vector Database**: Vector store tests use isolated temporary storage directories that are cleaned up after each test run to prevent cross-test contamination.
- **Offline / Deterministic Mode**: Tests utilize deterministic fallback embedding vectors and mocked LLM chains when external OpenAI API access is not configured.
- **Fast Execution**: All tests execute in sub-second to low-second timescales for rapid local CI feedback.

