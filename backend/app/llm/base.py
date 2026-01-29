"""
LLM Provider Base Classes and Data Types.

This module defines the abstract interface for LLM providers
and common data structures used across all implementations.

The system supports multiple LLM backends (Claude, OpenAI, Ollama)
through a common interface, allowing easy switching between providers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator


@dataclass
class Message:
    """
    Represents a single message in a conversation.

    Follows the standard LLM chat format.

    Attributes:
        role: The message author - 'user', 'assistant', or 'system'.
        content: The text content of the message.
    """
    role: str
    content: str


@dataclass
class LLMResponse:
    """
    Response from an LLM chat completion.

    Attributes:
        content: The generated text response.
        model: The model identifier that generated the response.
        finish_reason: Why generation stopped (e.g., 'stop', 'length').
    """
    content: str
    model: str
    finish_reason: str | None = None


class LLMProvider(ABC):
    """
    Abstract base class for LLM provider implementations.

    All LLM backends (Claude, OpenAI, Ollama) must implement this interface
    to be compatible with the application's chat functionality.

    Implementations should handle:
    - API authentication using configured credentials
    - Message format conversion to provider-specific format
    - Error handling and retries as appropriate
    """

    @abstractmethod
    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """
        Send messages to the LLM and get a complete response.

        Args:
            messages: Conversation history as list of Message objects.
            system_prompt: Optional system instructions for the model.
            temperature: Sampling temperature (0.0-1.0, higher = more random).
            max_tokens: Maximum tokens in the response.

        Returns:
            LLMResponse: The model's complete response.
        """
        pass

    @abstractmethod
    async def chat_stream(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """
        Send messages and stream the response token by token.

        Args:
            messages: Conversation history as list of Message objects.
            system_prompt: Optional system instructions for the model.
            temperature: Sampling temperature (0.0-1.0, higher = more random).
            max_tokens: Maximum tokens in the response.

        Yields:
            str: Individual text chunks as they are generated.
        """
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """
        Get the provider's identifier name.

        Returns:
            str: Provider name (e.g., 'claude', 'openai', 'ollama').
        """
        pass
