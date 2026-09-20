import os
import logging
from typing import List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.config import settings
from app.models.schemas import Message
from app.rag.prompts import SUMMARIZER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

class ConversationSummarizer:
    """Service to compress older conversational turns into a progressive summary."""

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.OPENAI_MODEL
        self._llm = None

    def _get_llm(self) -> Optional[ChatOpenAI]:
        api_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
        if not api_key or api_key.startswith("your_openai_api_key"):
            return None
        if self._llm is None:
            self._llm = ChatOpenAI(
                model=self.model_name,
                temperature=0.0,
                openai_api_key=api_key
            )
        return self._llm

    def summarize_messages(
        self,
        messages_to_summarize: List[Message],
        existing_summary: Optional[str] = None
    ) -> str:
        """Progressively update the conversation summary."""
        if not messages_to_summarize:
            return existing_summary or ""

        formatted_turns = []
        for msg in messages_to_summarize:
            role = "User" if msg.role == "user" else "Assistant"
            formatted_turns.append(f"{role}: {msg.content}")
        turns_text = "\n".join(formatted_turns)

        llm = self._get_llm()
        if not llm:
            logger.warning("OpenAI LLM not configured for summarization. Using fallback aggregator.")
            return self._heuristic_summary(turns_text, existing_summary)

        prompt_content = ""
        if existing_summary and existing_summary.strip():
            prompt_content += f"Existing Summary:\n{existing_summary.strip()}\n\n"
        prompt_content += f"New Conversation Turns to Integrate:\n{turns_text}\n\nUpdated Concise Summary:"

        try:
            response = llm.invoke([
                SystemMessage(content=SUMMARIZER_SYSTEM_PROMPT),
                HumanMessage(content=prompt_content)
            ])
            updated_summary = response.content.strip()
            logger.info("Successfully updated conversation summary.")
            return updated_summary
        except Exception as e:
            logger.error(f"Error during conversation summarization: {str(e)}", exc_info=True)
            return self._heuristic_summary(turns_text, existing_summary)

    def _heuristic_summary(self, turns_text: str, existing_summary: Optional[str]) -> str:
        """Deterministic fallback summary for offline testing."""
        lines = [line.strip() for line in turns_text.split("\n") if line.strip()]
        new_summary_part = "; ".join(lines)
        if existing_summary:
            return f"{existing_summary} | Recent points: {new_summary_part}"
        return f"Discussion points: {new_summary_part}"


_summarizer: Optional[ConversationSummarizer] = None

def get_summarizer() -> ConversationSummarizer:
    global _summarizer
    if _summarizer is None:
        _summarizer = ConversationSummarizer()
    return _summarizer
