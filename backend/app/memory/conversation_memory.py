import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from app.config import settings
from app.models.schemas import (
    Message,
    ConversationDetailResponse,
    ConversationSummaryItem,
    Citation
)
from app.memory.summarizer import get_summarizer

logger = logging.getLogger(__name__)

class ConversationSession:
    """Represents a single bounded conversation state with a sliding window and summary."""

    def __init__(
        self,
        conversation_id: str,
        max_recent_messages: Optional[int] = None,
        summary_trigger: Optional[int] = None
    ):
        self.conversation_id = conversation_id
        self.max_recent_messages = max_recent_messages or settings.MAX_RECENT_MESSAGES
        self.summary_trigger = summary_trigger or settings.SUMMARY_TRIGGER
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.updated_at = self.created_at
        self.summary: Optional[str] = None
        self.recent_messages: List[Message] = []
        self.total_turns_count: int = 0  # Total user+assistant messages since creation

    def add_turn(
        self,
        user_query: str,
        assistant_answer: str,
        rewritten_query: Optional[str] = None,
        sources: Optional[List[Citation]] = None
    ) -> None:
        """Add a complete user-assistant turn to memory and apply bounded summarization if threshold met."""
        self.updated_at = datetime.now(timezone.utc).isoformat()
        
        user_msg = Message(
            role="user",
            content=user_query,
            original_query=user_query,
            rewritten_query=rewritten_query,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        assistant_msg = Message(
            role="assistant",
            content=assistant_answer,
            sources=sources or [],
            timestamp=datetime.now(timezone.utc).isoformat()
        )

        self.recent_messages.append(user_msg)
        self.recent_messages.append(assistant_msg)
        self.total_turns_count += 2

        # Check if sliding window exceeds bounds or summary trigger
        self._check_and_summarize()

    def _check_and_summarize(self) -> None:
        """If recent messages count exceeds max_recent_messages, summarize older messages and trim window."""
        if len(self.recent_messages) > self.max_recent_messages:
            excess_count = len(self.recent_messages) - self.max_recent_messages
            messages_to_summarize = self.recent_messages[:excess_count]
            remaining_messages = self.recent_messages[excess_count:]

            logger.info(
                f"Conversation '{self.conversation_id}' exceeded recent window ({len(self.recent_messages)} > {self.max_recent_messages}). "
                f"Summarizing {len(messages_to_summarize)} older messages."
            )

            summarizer = get_summarizer()
            updated_summary = summarizer.summarize_messages(
                messages_to_summarize=messages_to_summarize,
                existing_summary=self.summary
            )
            self.summary = updated_summary
            self.recent_messages = remaining_messages

    def get_context_for_llm(self) -> Tuple[Optional[str], List[Message]]:
        """Return (summary, recent_messages) for context injection."""
        return self.summary, list(self.recent_messages)

    def to_detail_response(self) -> ConversationDetailResponse:
        return ConversationDetailResponse(
            conversation_id=self.conversation_id,
            created_at=self.created_at,
            updated_at=self.updated_at,
            summary=self.summary,
            recent_messages=self.recent_messages,
            total_turns=self.total_turns_count
        )


class ConversationMemoryManager:
    """Manages all active conversation sessions in memory."""

    def __init__(self):
        self._sessions: Dict[str, ConversationSession] = {}

    def get_or_create_session(self, conversation_id: Optional[str] = None) -> ConversationSession:
        """Retrieve existing conversation session or create a new one."""
        if not conversation_id or conversation_id.strip() == "":
            new_id = str(uuid.uuid4())
            session = ConversationSession(conversation_id=new_id)
            self._sessions[new_id] = session
            return session

        if conversation_id not in self._sessions:
            session = ConversationSession(conversation_id=conversation_id)
            self._sessions[conversation_id] = session
            return session

        return self._sessions[conversation_id]

    def get_session(self, conversation_id: str) -> Optional[ConversationSession]:
        return self._sessions.get(conversation_id)

    def delete_session(self, conversation_id: str) -> bool:
        if conversation_id in self._sessions:
            del self._sessions[conversation_id]
            logger.info(f"Deleted conversation session '{conversation_id}'")
            return True
        return False

    def list_sessions(self) -> List[ConversationSummaryItem]:
        items = []
        for sess in sorted(self._sessions.values(), key=lambda s: s.updated_at, reverse=True):
            # Generate a friendly title from first message or ID
            title = f"Chat {sess.conversation_id[:8]}"
            if sess.recent_messages:
                first_content = sess.recent_messages[0].content
                title = (first_content[:35] + "...") if len(first_content) > 35 else first_content

            items.append(ConversationSummaryItem(
                conversation_id=sess.conversation_id,
                title=title,
                created_at=sess.created_at,
                updated_at=sess.updated_at,
                message_count=sess.total_turns_count
            ))
        return items


_memory_manager: Optional[ConversationMemoryManager] = None

def get_memory_manager() -> ConversationMemoryManager:
    global _memory_manager
    if _memory_manager is None:
        _memory_manager = ConversationMemoryManager()
    return _memory_manager
