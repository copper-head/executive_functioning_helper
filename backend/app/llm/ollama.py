"""
Ollama LLM Provider.

This module implements the LLM provider interface for Ollama, a local
LLM runner. Ollama allows running open-source models locally without
API keys or cloud dependencies.

Configuration:
    OLLAMA_BASE_URL: URL of the Ollama server (default: http://localhost:11434)
    OLLAMA_MODEL: Model name to use (default: llama2)

Requirements:
    - Ollama must be installed and running locally
    - Desired model must be pulled (e.g., `ollama pull llama2`)

Benefits:
    - No API costs or rate limits
    - Data stays local (privacy)
    - Works offline
"""

from typing import AsyncIterator
import httpx

from app.llm.base import LLMProvider, Message, LLMResponse
from app.core.config import get_settings

settings = get_settings()


class OllamaProvider(LLMProvider):
    """
    LLM provider implementation for local Ollama models.

    Communicates with Ollama via its REST API using httpx for async support.
    Supports both streaming and non-streaming responses.
    """

    def __init__(self, base_url: str | None = None, model: str | None = None):
        """
        Initialize the Ollama provider.

        Args:
            base_url: Ollama server URL. Defaults to config value.
            model: Model name to use (must be pulled in Ollama).
        """
        self.base_url = base_url or settings.ollama_base_url
        self.model = model or settings.ollama_model

    @property
    def name(self) -> str:
        """Return the provider identifier."""
        return "ollama"

    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """
        Send a chat request to Ollama and get the complete response.

        Args:
            messages: Conversation history.
            system_prompt: System instructions (prepended as system message).
            temperature: Sampling temperature.
            max_tokens: Maximum response length (maps to num_predict).

        Returns:
            LLMResponse: Ollama's response with content and model info.
        """
        api_messages = []

        # Ollama uses OpenAI-style system messages
        if system_prompt:
            api_messages.append({"role": "system", "content": system_prompt})

        api_messages.extend([{"role": m.role, "content": m.content} for m in messages])

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": api_messages,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens,  # Ollama's equivalent of max_tokens
                    },
                },
                timeout=120.0,  # Local models can be slow on first request
            )
            response.raise_for_status()
            data = response.json()

        return LLMResponse(
            content=data["message"]["content"],
            model=data["model"],
            finish_reason="stop" if data.get("done") else None,
        )

    async def chat_stream(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """
        Stream a chat response from Ollama token by token.

        Ollama streams responses as newline-delimited JSON objects.

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

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": api_messages,
                    "stream": True,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens,
                    },
                },
                timeout=120.0,
            ) as response:
                response.raise_for_status()
                import json
                # Ollama streams newline-delimited JSON
                async for line in response.aiter_lines():
                    if line:
                        data = json.loads(line)
                        if "message" in data and "content" in data["message"]:
                            yield data["message"]["content"]
