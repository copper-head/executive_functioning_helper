from datetime import datetime
from pydantic import BaseModel
from app.db.models import MessageRole


class ConversationCreate(BaseModel):
    title: str | None = None
    context_type: str | None = None
    context_id: int | None = None


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    role: MessageRole
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    title: str | None
    context_type: str | None
    context_id: int | None
    messages: list[MessageResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationListItem(BaseModel):
    id: int
    title: str | None
    context_type: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class AgentChatRequest(BaseModel):
    message: str
    conversation_id: int | None = None


class AgentChatResponse(BaseModel):
    conversation_id: int
    message: MessageResponse
    response: MessageResponse
