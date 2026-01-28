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
    context_parts = []

    # Always include active goals
    goals_result = await db.execute(
        select(Goal).where(Goal.user_id == user.id, Goal.status == "active")
    )
    goals = goals_result.scalars().all()
    if goals:
        context_parts.append("User's active goals:")
        for g in goals:
            context_parts.append(f"- [{g.time_horizon.value}] {g.title}: {g.description or 'No description'}")

    # Add specific context based on type
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
    conversation = AgentConversation(
        user_id=current_user.id,
        title=conv_in.title,
        context_type=conv_in.context_type,
        context_id=conv_in.context_id,
    )
    db.add(conversation)
    await db.commit()

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
    # Get or create conversation
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
    else:
        conversation = AgentConversation(
            user_id=current_user.id,
            title=chat_request.message[:50] + "..." if len(chat_request.message) > 50 else chat_request.message,
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        conversation.messages = []

    # Add user message
    user_message = AgentMessage(
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=chat_request.message,
    )
    db.add(user_message)
    await db.commit()
    await db.refresh(user_message)

    # Build context and system prompt
    context = await build_context(db, current_user, conversation.context_type, conversation.context_id)
    system_prompt = get_context_prompt(conversation.context_type)
    if context:
        system_prompt = f"{system_prompt}\n\n--- User Context ---\n{context}"

    # Build message history
    messages = [
        Message(role=m.role.value, content=m.content)
        for m in conversation.messages
    ]
    messages.append(Message(role="user", content=chat_request.message))

    # Get LLM response
    llm = get_llm_provider()
    response = await llm.chat(messages, system_prompt=system_prompt)

    # Save assistant message
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
    # Get or create conversation
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
    else:
        conversation = AgentConversation(
            user_id=current_user.id,
            title=chat_request.message[:50] + "..." if len(chat_request.message) > 50 else chat_request.message,
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        conversation.messages = []

    # Add user message
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

    # Build message history
    messages = [
        Message(role=m.role.value, content=m.content)
        for m in conversation.messages
    ]
    messages.append(Message(role="user", content=chat_request.message))

    llm = get_llm_provider()

    async def generate():
        full_response = []
        async for chunk in llm.chat_stream(messages, system_prompt=system_prompt):
            full_response.append(chunk)
            yield f"data: {chunk}\n\n"

        # Save the complete response
        content = "".join(full_response)
        assistant_message = AgentMessage(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=content,
        )
        db.add(assistant_message)
        await db.commit()

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
