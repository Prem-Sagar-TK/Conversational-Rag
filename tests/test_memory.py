import pytest
from app.memory.conversation_memory import ConversationSession, ConversationMemoryManager
from app.models.schemas import Citation

def test_bounded_memory_and_sliding_window():
    # Set max recent messages to 4 (2 turns)
    session = ConversationSession(conversation_id="test_bounded_1", max_recent_messages=4, summary_trigger=4)
    
    # Turn 1
    session.add_turn("What is annual leave?", "20 days per year.")
    assert len(session.recent_messages) == 2
    assert session.summary is None
    
    # Turn 2
    session.add_turn("Can it be carried forward?", "Yes, up to 5 days into Q1.")
    assert len(session.recent_messages) == 4
    assert session.summary is None
    
    # Turn 3 -> Exceeds max_recent_messages (4), triggers summarization of excess messages
    session.add_turn("What about sick leave?", "10 days paid sick leave.")
    # Total messages in sliding window should stay bounded at 4
    assert len(session.recent_messages) == 4
    assert session.summary is not None
    assert len(session.summary) > 0
    assert session.total_turns_count == 6

def test_memory_manager_lifecycle():
    manager = ConversationMemoryManager()
    
    # Create session
    sess1 = manager.get_or_create_session()
    sess_id = sess1.conversation_id
    assert sess_id is not None
    
    # Retrieve session
    retrieved = manager.get_session(sess_id)
    assert retrieved is not None
    assert retrieved.conversation_id == sess_id
    
    # Add turn
    sess1.add_turn("Hello", "Hi! How can I help you?")
    
    # List sessions
    sessions_list = manager.list_sessions()
    assert len(sessions_list) == 1
    assert sessions_list[0].conversation_id == sess_id
    assert sessions_list[0].message_count == 2
    
    # Delete session
    assert manager.delete_session(sess_id) is True
    assert manager.get_session(sess_id) is None
    assert len(manager.list_sessions()) == 0
