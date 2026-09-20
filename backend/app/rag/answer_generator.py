import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.config import settings
from app.models.schemas import Message, Citation
from app.rag.prompts import ANSWER_GENERATOR_SYSTEM_PROMPT
from app.rag.retriever import get_retriever

logger = logging.getLogger(__name__)

class AnswerGenerator:
    """Generates grounded answers based on retrieved document chunks and conversation history."""

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.OPENAI_MODEL
        self._llm = None
        self.retriever = get_retriever()

    def _get_llm(self) -> Optional[ChatOpenAI]:
        api_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
        if not api_key or api_key.startswith("your_openai_api_key"):
            return None
        if self._llm is None:
            self._llm = ChatOpenAI(
                model=self.model_name,
                temperature=0.1,
                openai_api_key=api_key
            )
        return self._llm

    def generate_answer(
        self,
        original_query: str,
        rewritten_query: str,
        retrieved_chunks: List[Dict[str, Any]],
        recent_messages: Optional[List[Message]] = None,
        summary: Optional[str] = None
    ) -> Tuple[str, List[Citation]]:
        """
        Generate a grounded answer and format citations.
        Returns (answer_string, list_of_citations).
        """
        # Format citations
        citations = self.retriever.format_citations(retrieved_chunks)

        if not retrieved_chunks:
            no_info_msg = "I couldn't find that information in the uploaded documents."
            return no_info_msg, []

        # Prepare formatted context
        context_str = self.retriever.format_context_for_llm(retrieved_chunks)
        llm = self._get_llm()

        if not llm:
            logger.warning("OpenAI LLM not configured for answer generation. Generating grounded extract from chunks.")
            return self._fallback_answer_generation(original_query, retrieved_chunks), citations

        # Build prompt
        messages = [
            SystemMessage(content=ANSWER_GENERATOR_SYSTEM_PROMPT.format(context=context_str))
        ]

        # Add conversation context if available
        if summary and summary.strip():
            messages.append(SystemMessage(content=f"Prior Conversation Summary:\n{summary}"))

        if recent_messages:
            for msg in recent_messages[-4:]:  # Include last 2 turns for context continuity
                if msg.role == "user":
                    messages.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    messages.append(AIMessage(content=msg.content))

        # Add the current question (using the original user query, grounded by retrieved context)
        prompt_question = f"Question: {original_query}"
        if rewritten_query and rewritten_query.lower() != original_query.lower():
            prompt_question += f"\n(Contextual intent: {rewritten_query})"
        
        messages.append(HumanMessage(content=prompt_question))

        try:
            response = llm.invoke(messages)
            answer_text = response.content.strip()
            return answer_text, citations
        except Exception as e:
            logger.error(f"Error generating answer with LLM: {str(e)}", exc_info=True)
            return self._fallback_answer_generation(original_query, retrieved_chunks), citations

    def _fallback_answer_generation(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        """Grounded answer generation without active OpenAI API key (for unit tests / mock mode)."""
        if not chunks:
            return "I couldn't find that information in the uploaded documents."

        top_chunk = chunks[0]
        meta = top_chunk.get("metadata", {})
        doc = meta.get("filename", "Document")
        page = meta.get("page")
        page_str = f" (Page {page})" if page else ""
        content = top_chunk.get("content", "").strip()

        return f"Based on **{doc}**{page_str}:\n\n{content}"


_answer_generator: Optional[AnswerGenerator] = None

def get_answer_generator() -> AnswerGenerator:
    global _answer_generator
    if _answer_generator is None:
        _answer_generator = AnswerGenerator()
    return _answer_generator
