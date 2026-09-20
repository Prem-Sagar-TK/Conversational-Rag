import pytest
from app.rag.query_rewriter import QueryRewriter
from app.models.schemas import Message

def test_standalone_query_without_context():
    rewriter = QueryRewriter()
    original = "What is the annual leave policy?"
    rewritten = rewriter.rewrite_query(original, recent_messages=[], summary=None)
    assert rewritten == original

def test_empty_query_handling():
    rewriter = QueryRewriter()
    assert rewriter.rewrite_query("   ", recent_messages=[], summary=None) == ""

def test_followup_heuristic_rewriting_without_llm():
    rewriter = QueryRewriter()
    history = [
        Message(role="user", content="What is the employee annual leave policy?"),
        Message(role="assistant", content="Employees receive 20 days of paid leave annually.")
    ]
    follow_up = "How many days is that?"
    rewritten = rewriter.rewrite_query(follow_up, recent_messages=history, summary=None)
    # Even without LLM configured, heuristic or LLM resolves context
    assert len(rewritten) > len(follow_up) or "annual leave" in rewritten.lower()
