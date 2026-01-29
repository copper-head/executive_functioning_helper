"""
AI Agent Pydantic Schemas.

This module defines request/response schemas for the AI chat endpoints
including conversations and messages.
"""

from datetime import datetime
from pydantic import BaseModel
from app.db.models import MessageRole


class ConversationCreate(BaseModel):
    """
    Schema for creating a new conversation.

    Attributes:
        title: Display title for the conversation.
        context_type: Type of context (e.g., 'daily_planning', 'goal_setting').
        context_id: ID of related entity for context loading.
    """
    title: str | None = None
    context_type: str | None = None
    context_id: int | None = None


class MessageCreate(BaseModel):
    """
    Schema for creating a message (used internally).

    Attributes:
        content: The message text content.
    """
    content: str


class MessageResponse(BaseModel):
    """
    Schema for message response data.

    Attributes:
        id: Unique identifier.
        role: Who sent the message (user, assistant, system).
        content: The message text.
        created_at: When the message was created.
    """
    id: int
    role: MessageRole
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """
    Schema for full conversation response with messages.

    Attributes:
        id: Unique identifier.
        title: Conversation title.
        context_type: Type of context if any.
        context_id: Related entity ID if any.
        messages: Full list of messages in chronological order.
        created_at: When the conversation started.
    """
    id: int
    title: str | None
    context_type: str | None
    context_id: int | None
    messages: list[MessageResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationListItem(BaseModel):
    """
    Schema for conversation list (without messages).

    Used for listing conversations without loading full message history.

    Attributes:
        id: Unique identifier.
        title: Conversation title.
        context_type: Type of context if any.
        created_at: When the conversation started.
    """
    id: int
    title: str | None
    context_type: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class AgentChatRequest(BaseModel):
    """
    Schema for chat request to AI assistant.

    Attributes:
        message: The user's message text.
        conversation_id: Optional ID to continue existing conversation.
                        If not provided, creates a new conversation.
    """
    message: str
    conversation_id: int | None = None


class AgentChatResponse(BaseModel):
    """
    Schema for chat response from AI assistant.

    Includes both the user's message and the AI's response.

    Attributes:
        conversation_id: ID of the conversation (new or existing).
        message: The user's message that was sent.
        response: The AI assistant's response.
    """
    conversation_id: int
    message: MessageResponse
    response: MessageResponse
