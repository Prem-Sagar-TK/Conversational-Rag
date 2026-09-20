import logging
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ChatRequest, ChatResponse
from app.memory.conversation_memory import get_memory_manager
from app.rag.query_rewriter import get_query_rewriter
from app.rag.retriever import get_retriever
from app.rag.answer_generator import get_answer_generator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Conversational RAG Chat Endpoint:
    1. Resolve bounded memory context (summary + recent messages)
    2. Contextual Query Rewriter resolves pronouns & follow-ups into standalone retrieval query
    3. ChromaDB Vector Retriever retrieves top-k relevant chunks
    4. Answer Generator synthesizes grounded response with exact citations
    5. Memory Manager updates sliding window & triggers self-summarization when bounds exceeded
    """
    cleaned_message = request.message.strip()
    if not cleaned_message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty.")

    try:
        # Step 1: Resolve conversation session
        memory_manager = get_memory_manager()
        session = memory_manager.get_or_create_session(request.conversation_id)
        existing_summary, recent_messages = session.get_context_for_llm()

        # Step 2: Contextual Query Rewriting
        query_rewriter = get_query_rewriter()
        rewritten_query = query_rewriter.rewrite_query(
            latest_user_query=cleaned_message,
            recent_messages=recent_messages,
            summary=existing_summary
        )

        # Step 3: Vector Retrieval
        retriever = get_retriever()
        retrieved_chunks = retriever.retrieve(
            query=rewritten_query,
            top_k=request.top_k
        )

        # Step 4: Answer Generation + Citations
        answer_generator = get_answer_generator()
        answer, citations = answer_generator.generate_answer(
            original_query=cleaned_message,
            rewritten_query=rewritten_query,
            retrieved_chunks=retrieved_chunks,
            recent_messages=recent_messages,
            summary=existing_summary
        )

        # Step 5: Update Bounded Memory (handles self-summarization)
        session.add_turn(
            user_query=cleaned_message,
            assistant_answer=answer,
            rewritten_query=rewritten_query,
            sources=citations
        )

        return ChatResponse(
            answer=answer,
            original_query=cleaned_message,
            rewritten_query=rewritten_query,
            sources=citations,
            conversation_id=session.conversation_id,
            summary_state=session.summary,
            recent_message_count=len(session.recent_messages)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat query: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while generating the response: {str(e)}"
        )
