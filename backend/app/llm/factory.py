from app.llm.base import LLMProvider
from app.llm.claude import ClaudeProvider
from app.llm.openai_provider import OpenAIProvider
from app.llm.ollama import OllamaProvider
from app.core.config import get_settings

settings = get_settings()


def get_llm_provider(provider_name: str | None = None) -> LLMProvider:
    provider = provider_name or settings.llm_provider

    if provider == "claude":
        return ClaudeProvider()
    elif provider == "openai":
        return OpenAIProvider()
    elif provider == "ollama":
        return OllamaProvider()
    else:
        raise ValueError(f"Unknown LLM provider: {provider}")
