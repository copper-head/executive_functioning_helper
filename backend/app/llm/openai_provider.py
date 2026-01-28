from typing import AsyncIterator
from openai import AsyncOpenAI

from app.llm.base import LLMProvider, Message, LLMResponse
from app.core.config import get_settings

settings = get_settings()


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str | None = None, model: str = "gpt-4-turbo-preview"):
        self.api_key = api_key or settings.openai_api_key
        self.model = model
        self.client = AsyncOpenAI(api_key=self.api_key)

    @property
    def name(self) -> str:
        return "openai"

    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        api_messages = []

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

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
