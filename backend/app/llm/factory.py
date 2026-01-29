"""
LLM Provider Factory.

This module provides a factory function for creating LLM provider instances
based on configuration or explicit selection. The factory pattern allows
the application to switch between providers without changing calling code.

Supported Providers:
    - claude: Anthropic's Claude models (requires ANTHROPIC_API_KEY)
    - openai: OpenAI's GPT models (requires OPENAI_API_KEY)
    - ollama: Local Ollama models (requires running Ollama server)

The default provider is set via the LLM_PROVIDER environment variable.
"""

from app.llm.base import LLMProvider
from app.llm.claude import ClaudeProvider
from app.llm.openai_provider import OpenAIProvider
from app.llm.ollama import OllamaProvider
from app.core.config import get_settings

settings = get_settings()


def get_llm_provider(provider_name: str | None = None) -> LLMProvider:
    """
    Create and return an LLM provider instance.

    Factory function that instantiates the appropriate provider based
    on configuration or explicit selection.

    Args:
        provider_name: Optional provider name to override config default.
                      Valid values: 'claude', 'openai', 'ollama'.

    Returns:
        LLMProvider: An initialized provider instance ready for chat.

    Raises:
        ValueError: If the specified provider name is not recognized.

    Example:
        # Use configured default provider
        llm = get_llm_provider()
        response = await llm.chat(messages)

        # Explicitly use Claude
        llm = get_llm_provider("claude")
    """
    provider = provider_name or settings.llm_provider

    if provider == "claude":
        return ClaudeProvider()
    elif provider == "openai":
        return OpenAIProvider()
    elif provider == "ollama":
        return OllamaProvider()
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")
