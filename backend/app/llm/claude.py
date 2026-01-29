"""
Claude (Anthropic) LLM Provider.

This module implements the LLM provider interface for Anthropic's Claude models.
Claude is the recommended provider for this application due to its strong
performance on conversational and planning tasks.

Configuration:
    ANTHROPIC_API_KEY: Your Anthropic API key

Model Selection:
    Default: claude-sonnet-4-20250514 (good balance of quality and speed)
    Can be overridden via constructor for specific use cases.
"""

from typing import AsyncIterator
import anthropic

from app.llm.base import LLMProvider, Message, LLMResponse
from app.core.config import get_settings

settings = get_settings()


class ClaudeProvider(LLMProvider):
    """
    LLM provider implementation for Anthropic's Claude models.

    Uses the official Anthropic Python SDK with async support.
    Handles message format conversion and streaming responses.
    """

    def __init__(self, api_key: str | None = None, model: str = "claude-sonnet-4-20250514"):
        """
        Initialize the Claude provider.

        Args:
            api_key: Anthropic API key. If not provided, uses ANTHROPIC_API_KEY from config.
            model: Model identifier to use. Defaults to Claude Sonnet 4.
        """
        self.api_key = api_key or settings.anthropic_api_key
        self.model = model
        self.client = anthropic.AsyncAnthropic(api_key=self.api_key)

    @property
    def name(self) -> str:
        """Return the provider identifier."""
        return "claude"

    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """
        Send a chat request to Claude and get the complete response.

        Args:
            messages: Conversation history.
            system_prompt: System instructions (Claude uses a separate system param).
            temperature: Sampling temperature.
            max_tokens: Maximum response length.

        Returns:
            LLMResponse: Claude's response with content, model, and stop reason.
        """
        # Convert to Anthropic message format
        api_messages = [{"role": m.role, "content": m.content} for m in messages]

        kwargs = {
            "model": self.model,
            "messages": api_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        # Claude uses a dedicated system parameter (not a system message)
        if system_prompt:
            kwargs["system"] = system_prompt

        response = await self.client.messages.create(**kwargs)

        return LLMResponse(
            content=response.content[0].text,
            model=response.model,
            finish_reason=response.stop_reason,
        )

    async def chat_stream(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """
        Stream a chat response from Claude token by token.

        Args:
            messages: Conversation history.
            system_prompt: System instructions.
            temperature: Sampling temperature.
            max_tokens: Maximum response length.

        Yields:
            str: Text chunks as they are generated.
        """
        api_messages = [{"role": m.role, "content": m.content} for m in messages]

        kwargs = {
            "model": self.model,
            "messages": api_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        if system_prompt:
            kwargs["system"] = system_prompt

        # Use streaming context manager for efficient chunk processing
        async with self.client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text
