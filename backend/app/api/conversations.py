import logging
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    ConversationCreateResponse,
    ConversationDetailResponse,
    ConversationListResponse
)
from app.memory.conversation_memory import get_memory_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])

@router.post("", response_model=ConversationCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation():
    """Create a new conversational session."""
    try:
        memory_manager = get_memory_manager()
        session = memory_manager.get_or_create_session()
        return ConversationCreateResponse(
            conversation_id=session.conversation_id,
            created_at=session.created_at
        )
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create conversation.")

@router.get("", response_model=ConversationListResponse)
async def list_conversations():
    """List all active conversation sessions."""
    try:
        memory_manager = get_memory_manager()
        sessions = memory_manager.list_sessions()
        return ConversationListResponse(conversations=sessions)
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list conversations.")

@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(conversation_id: str):
    """Retrieve conversation details, bounded summary, and recent messages."""
    memory_manager = get_memory_manager()
    session = memory_manager.get_session(conversation_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found."
        )
    return session.to_detail_response()

@router.delete("/{conversation_id}", status_code=status.HTTP_200_OK)
async def delete_conversation(conversation_id: str):
    """Delete a conversation session."""
    memory_manager = get_memory_manager()
    deleted = memory_manager.delete_session(conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found."
        )
    return {
        "status": "success",
        "message": f"Successfully deleted conversation '{conversation_id}'."
    }
