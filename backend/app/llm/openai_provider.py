"""
OpenAI LLM Provider.

This module implements the LLM provider interface for OpenAI's GPT models.
Provides an alternative to Claude for users who prefer or have access to
OpenAI's API.

Configuration:
    OPENAI_API_KEY: Your OpenAI API key

Model Selection:
    Default: gpt-4-turbo-preview (latest GPT-4 with good performance)
    Can be overridden via constructor for specific use cases.
"""

from typing import AsyncIterator
from openai import AsyncOpenAI

from app.llm.base import LLMProvider, Message, LLMResponse
from app.core.config import get_settings

settings = get_settings()


class OpenAIProvider(LLMProvider):
    """
    LLM provider implementation for OpenAI's GPT models.

    Uses the official OpenAI Python SDK with async support.
    Handles message format conversion including system messages.
    """

    def __init__(self, api_key: str | None = None, model: str = "gpt-4-turbo-preview"):
        """
        Initialize the OpenAI provider.

        Args:
            api_key: OpenAI API key. If not provided, uses OPENAI_API_KEY from config.
            model: Model identifier to use. Defaults to GPT-4 Turbo.
        """
        self.api_key = api_key or settings.openai_api_key
        self.model = model
        self.client = AsyncOpenAI(api_key=self.api_key)

    @property
    def name(self) -> str:
        """Return the provider identifier."""
        return "openai"

    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """
        Send a chat request to OpenAI and get the complete response.

        Args:
            messages: Conversation history.
            system_prompt: System instructions (prepended as system message).
            temperature: Sampling temperature.
            max_tokens: Maximum response length.

        Returns:
            LLMResponse: GPT's response with content, model, and finish reason.
        """
        api_messages = []

        # OpenAI uses system messages prepended to the conversation
        if system_prompt:
            api_messages.append({"role": "system", "content": system_prompt})

        api_messages.extend([{"role": m.role, "content": m.content} for m in messages])

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=api_messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        choice = response.choices[0]
        return LLMResponse(
            content=choice.message.content or "",
            model=response.model,
            finish_reason=choice.finish_reason,
        )

    async def chat_stream(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """
        Stream a chat response from OpenAI token by token.

        Args:
            messages: Conversation history.
            system_prompt: System instructions.
            temperature: Sampling temperature.
            max_tokens: Maximum response length.

        Yields:
            str: Text chunks as they are generated.
        """
        api_messages = []

        if system_prompt:
            api_messages.append({"role": "system", "content": system_prompt})

        api_messages.extend([{"role": m.role, "content": m.content} for m in messages])

        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=api_messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True,
        )

        # Extract content from each streamed chunk
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
