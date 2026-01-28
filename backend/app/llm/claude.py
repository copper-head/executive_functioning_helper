from typing import AsyncIterator
import anthropic

from app.llm.base import LLMProvider, Message, LLMResponse
from app.core.config import get_settings

settings = get_settings()


class ClaudeProvider(LLMProvider):
    def __init__(self, api_key: str | None = None, model: str = "claude-sonnet-4-20250514"):
        self.api_key = api_key or settings.anthropic_api_key
        self.model = model
        self.client = anthropic.AsyncAnthropic(api_key=self.api_key)

    @property
    def name(self) -> str:
        return "claude"

    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        api_messages = [{"role": m.role, "content": m.content} for m in messages]

        kwargs = {
            "model": self.model,
            "messages": api_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

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
        api_messages = [{"role": m.role, "content": m.content} for m in messages]

        kwargs = {
            "model": self.model,
            "messages": api_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        if system_prompt:
            kwargs["system"] = system_prompt

        async with self.client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text
