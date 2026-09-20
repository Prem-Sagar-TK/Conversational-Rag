import os
import logging
from typing import List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.config import settings
from app.models.schemas import Message
from app.rag.prompts import QUERY_REWRITER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

class QueryRewriter:
    """Dedicated query rewriter that converts context-dependent follow-ups into standalone search queries."""

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.OPENAI_MODEL
        self._llm = None

    def _get_llm(self) -> Optional[ChatOpenAI]:
        """Lazy initialization of ChatOpenAI."""
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

    def _format_conversation_context(
        self,
        summary: Optional[str],
        recent_messages: List[Message]
    ) -> str:
        """Format existing conversation summary and recent message window into clean text."""
        context_parts = []
        if summary and summary.strip():
            context_parts.append(f"Conversation Summary:\n{summary.strip()}")

        if recent_messages:
            context_parts.append("Recent Conversation Turns:")
            for msg in recent_messages:
                role_label = "User" if msg.role == "user" else "Assistant"
                context_parts.append(f"{role_label}: {msg.content}")

        return "\n\n".join(context_parts)

    def rewrite_query(
        self,
        latest_user_query: str,
        recent_messages: Optional[List[Message]] = None,
        summary: Optional[str] = None
    ) -> str:
        """
        Rewrite a user query into a standalone retrieval query using context.
        If no context exists or LLM is unavailable, returns the original query.
        """
        query_stripped = latest_user_query.strip()
        if not query_stripped:
            return ""

        messages = recent_messages or []
        # If there is no previous conversation history or summary, return as-is
        if not messages and not summary:
            logger.info("No conversational history present. Preserving original query.")
            return query_stripped

        llm = self._get_llm()
        if not llm:
            logger.warning("OpenAI LLM not configured for query rewriting. Using fallback heuristic.")
            return self._heuristic_rewrite(query_stripped, messages, summary)

        context_str = self._format_conversation_context(summary, messages)
        prompt_content = f"""{context_str}

Latest User Query: {query_stripped}

Standalone Search Query:"""

        try:
            response = llm.invoke([
                SystemMessage(content=QUERY_REWRITER_SYSTEM_PROMPT),
                HumanMessage(content=prompt_content)
            ])
            rewritten = response.content.strip()
            # Clean any leftover formatting or quotation marks
            rewritten = rewritten.strip('"\'`')
            if rewritten.lower().startswith("standalone search query:"):
                rewritten = rewritten.split(":", 1)[1].strip()

            logger.info(f"Original Query: '{query_stripped}' -> Rewritten: '{rewritten}'")
            return rewritten or query_stripped
        except Exception as e:
            logger.error(f"Error during query rewriting: {str(e)}", exc_info=True)
            return query_stripped

    def _heuristic_rewrite(
        self,
        query: str,
        recent_messages: List[Message],
        summary: Optional[str]
    ) -> str:
        """Heuristic fallback when LLM is unavailable (e.g. offline testing)."""
        lower_query = query.lower()
        pronouns = ["that", "it", "this", "they", "those", "how many days", "how long", "can it"]
        has_pronoun = any(p in lower_query for p in pronouns)

        if not has_pronoun or not recent_messages:
            return query

        # Find the last user or assistant topic
        last_user_msg = next((m for m in reversed(recent_messages) if m.role == "user"), None)
        if last_user_msg:
            return f"{query} regarding {last_user_msg.content.rstrip('?')}"
        return query


_query_rewriter: Optional[QueryRewriter] = None

def get_query_rewriter() -> QueryRewriter:
    global _query_rewriter
    if _query_rewriter is None:
        _query_rewriter = QueryRewriter()
    return _query_rewriter
