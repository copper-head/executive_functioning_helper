"""
AI Agent API Routes.

This module provides endpoints for interacting with the AI assistant:

Conversations:
    - GET /conversations: List all conversations
    - POST /conversations: Create a new conversation
    - GET /conversations/{conv_id}: Get conversation with messages
    - DELETE /conversations/{conv_id}: Delete a conversation

Chat:
    - POST /chat: Send a message and get a response
    - POST /chat/stream: Send a message and stream the response

The AI assistant helps users with executive functioning tasks like planning,
goal setting, and staying oriented. Conversations can be contextual (linked
to daily/weekly plans) to provide the AI with relevant information.

The system supports multiple LLM providers (Claude, OpenAI, Ollama) which
can be configured via environment variables.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import User, AgentConversation, AgentMessage, MessageRole, Goal, DailyPlan, WeeklyPlan
from app.schemas.agent import (
    ConversationCreate, MessageCreate, ConversationResponse,
    ConversationListItem, AgentChatRequest, AgentChatResponse, MessageResponse,
)
from app.api.deps import get_current_user
from app.llm.factory import get_llm_provider
from app.llm.base import Message
from app.llm.prompts import get_context_prompt

router = APIRouter()


async def build_context(
    db: AsyncSession,
    user: User,
    context_type: str | None,
    context_id: int | None,
) -> str:
    """
    Build contextual information for the AI assistant.

    Gathers relevant user data to include in the system prompt,
    helping the AI provide personalized assistance. Always includes
    active goals, and adds specific context based on conversation type.

    Args:
        db: Database session for querying user data.
        user: The current user.
        context_type: Type of context (e.g., 'daily_planning', 'weekly_planning').
        context_id: ID of the related entity (e.g., daily_plan_id).

    Returns:
        str: Formatted context string to append to system prompt,
             or empty string if no context is available.
    """
    context_parts = []

    # Always include active goals to help AI understand user priorities
    goals_result = await db.execute(
        select(Goal).where(Goal.user_id == user.id, Goal.status == "active")
    )
    goals = goals_result.scalars().all()
    if goals:
        context_parts.append("User's active goals:")
        for g in goals:
            context_parts.append(f"- [{g.time_horizon.value}] {g.title}: {g.description or 'No description'}")

    # Add specific context based on conversation type
    if context_type == "daily_planning" and context_id:
        result = await db.execute(
            select(DailyPlan)
            .where(DailyPlan.id == context_id, DailyPlan.user_id == user.id)
            .options(selectinload(DailyPlan.items))
        )
        plan = result.scalar_one_or_none()
        if plan:
            context_parts.append(f"\nCurrent daily plan for {plan.date}:")
            context_parts.append(f"Summary: {plan.summary or 'None'}")
            if plan.items:
                context_parts.append("Items:")
                for item in plan.items:
                    context_parts.append(f"- [{item.status.value}] {item.title}")

    elif context_type == "weekly_planning" and context_id:
        result = await db.execute(
            select(WeeklyPlan).where(WeeklyPlan.id == context_id, WeeklyPlan.user_id == user.id)
        )
        plan = result.scalar_one_or_none()
        if plan:
            context_parts.append(f"\nCurrent weekly plan starting {plan.week_start_date}:")
            context_parts.append(f"Summary: {plan.summary or 'None'}")
            context_parts.append(f"Focus areas: {plan.focus_areas or 'None'}")

    return "\n".join(context_parts) if context_parts else ""


@router.get("/conversations", response_model=list[ConversationListItem])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all conversations for the current user.

    Returns conversations ordered by creation date (newest first),
    without including full message history.

    Args:
        current_user: The authenticated user.
        db: Database session.

    Returns:
        list[ConversationListItem]: Summary list of conversations.
    """
    result = await db.execute(
        select(AgentConversation)
        .where(AgentConversation.user_id == current_user.id)
        .order_by(AgentConversation.created_at.desc())
    )
    return result.scalars().all()


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new conversation.

    Conversations can optionally have a context type and ID to link
    them to specific planning entities (daily plan, weekly plan, etc.).

    Args:
        conv_in: Conversation data (title, context_type, context_id).
        current_user: The authenticated user.
        db: Database session.

    Returns:
        ConversationResponse: The newly created conversation.
    """
    conversation = AgentConversation(
        user_id=current_user.id,
        title=conv_in.title,
        context_type=conv_in.context_type,
        context_id=conv_in.context_id,
    )
    db.add(conversation)
    await db.commit()

    # Re-fetch with messages relationship loaded
    result = await db.execute(
        select(AgentConversation)
        .where(AgentConversation.id == conversation.id)
        .options(selectinload(AgentConversation.messages))
    )
    return result.scalar_one()


@router.get("/conversations/{conv_id}", response_model=ConversationResponse)
async def get_conversation(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a conversation with its full message history.

    Args:
        conv_id: The conversation's unique identifier.
        current_user: The authenticated user.
        db: Database session.

    Returns:
        ConversationResponse: The conversation with all messages.

    Raises:
        HTTPException: 404 if conversation not found or doesn't belong to user.
    """
    result = await db.execute(
        select(AgentConversation)
        .where(AgentConversation.id == conv_id, AgentConversation.user_id == current_user.id)
        .options(selectinload(AgentConversation.messages))
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    return conversation


@router.delete("/conversations/{conv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a conversation and all its messages.

    Messages are cascade deleted along with the conversation.

    Args:
        conv_id: The conversation's unique identifier.
        current_user: The authenticated user.
        db: Database session.

    Raises:
        HTTPException: 404 if conversation not found or doesn't belong to user.
    """
    result = await db.execute(
        select(AgentConversation)
        .where(AgentConversation.id == conv_id, AgentConversation.user_id == current_user.id)
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    await db.delete(conversation)
    await db.commit()


@router.post("/chat", response_model=AgentChatResponse)
async def chat(
    chat_request: AgentChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message to the AI assistant and get a response.

    If conversation_id is provided, continues an existing conversation.
    Otherwise, creates a new conversation with an auto-generated title.
    Both the user message and AI response are saved to the database.

    The AI receives contextual information based on the conversation's
    context_type (e.g., active goals, current daily plan).

    Args:
        chat_request: Message content and optional conversation_id.
        current_user: The authenticated user.
        db: Database session.

    Returns:
        AgentChatResponse: The conversation ID, user message, and AI response.

    Raises:
        HTTPException: 404 if specified conversation_id not found.
    """
    # Get or create conversation
    if chat_request.conversation_id:
        # Continue existing conversation
        result = await db.execute(
            select(AgentConversation)
            .where(
                AgentConversation.id == chat_request.conversation_id,
                AgentConversation.user_id == current_user.id,
            )
            .options(selectinload(AgentConversation.messages))
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        # Convert existing messages to LLM format
        message_history = [Message(role=m.role.value, content=m.content) for m in conversation.messages]
    else:
        # Create new conversation with auto-generated title from first message
        conversation = AgentConversation(
            user_id=current_user.id,
            title=chat_request.message[:50] + "..." if len(chat_request.message) > 50 else chat_request.message,
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        message_history = []

    # Persist user message to database
    user_message = AgentMessage(
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=chat_request.message,
    )
    db.add(user_message)
    await db.commit()
    await db.refresh(user_message)

    # Build context and system prompt based on conversation type
    context = await build_context(db, current_user, conversation.context_type, conversation.context_id)
    system_prompt = get_context_prompt(conversation.context_type)
    if context:
        system_prompt = f"{system_prompt}\n\n--- User Context ---\n{context}"

    # Prepare message history for LLM
    messages = [*message_history, Message(role="user", content=chat_request.message)]

    # Call LLM provider for response
    llm = get_llm_provider()
    response = await llm.chat(messages, system_prompt=system_prompt)

    # Persist assistant response to database
    assistant_message = AgentMessage(
        conversation_id=conversation.id,
        role=MessageRole.ASSISTANT,
        content=response.content,
    )
    db.add(assistant_message)
    await db.commit()
    await db.refresh(assistant_message)

    return AgentChatResponse(
        conversation_id=conversation.id,
        message=MessageResponse(
            id=user_message.id,
            role=user_message.role,
            content=user_message.content,
            created_at=user_message.created_at,
        ),
        response=MessageResponse(
            id=assistant_message.id,
            role=assistant_message.role,
            content=assistant_message.content,
            created_at=assistant_message.created_at,
        ),
    )


@router.post("/chat/stream")
async def chat_stream(
    chat_request: AgentChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message to the AI assistant and stream the response.

    Similar to the /chat endpoint but returns a Server-Sent Events (SSE)
    stream for real-time response display. Each chunk is sent as a
    "data: <content>" event. The stream ends with "data: [DONE]".

    The complete response is saved to the database after streaming finishes.

    Args:
        chat_request: Message content and optional conversation_id.
        current_user: The authenticated user.
        db: Database session.

    Returns:
        StreamingResponse: SSE stream of response chunks.

    Raises:
        HTTPException: 404 if specified conversation_id not found.
    """
    # Get or create conversation (same logic as non-streaming endpoint)
    if chat_request.conversation_id:
        result = await db.execute(
            select(AgentConversation)
            .where(
                AgentConversation.id == chat_request.conversation_id,
                AgentConversation.user_id == current_user.id,
            )
            .options(selectinload(AgentConversation.messages))
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        message_history = [Message(role=m.role.value, content=m.content) for m in conversation.messages]
    else:
        conversation = AgentConversation(
            user_id=current_user.id,
            title=chat_request.message[:50] + "..." if len(chat_request.message) > 50 else chat_request.message,
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        message_history = []

    # Persist user message immediately
    user_message = AgentMessage(
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=chat_request.message,
    )
    db.add(user_message)
    await db.commit()

    # Build context and system prompt
    context = await build_context(db, current_user, conversation.context_type, conversation.context_id)
    system_prompt = get_context_prompt(conversation.context_type)
    if context:
        system_prompt = f"{system_prompt}\n\n--- User Context ---\n{context}"

    # Prepare message history for LLM
    messages = [*message_history, Message(role="user", content=chat_request.message)]

    llm = get_llm_provider()

    async def generate():
        """
        Generator that streams LLM response chunks as SSE events.

        Accumulates the full response to save to database after streaming.
        """
        full_response = []
        async for chunk in llm.chat_stream(messages, system_prompt=system_prompt):
            full_response.append(chunk)
            yield f"data: {chunk}\n\n"

        # Save the complete response after streaming finishes
        content = "".join(full_response)
        assistant_message = AgentMessage(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=content,
        )
        db.add(assistant_message)
        await db.commit()

        # Signal end of stream
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
