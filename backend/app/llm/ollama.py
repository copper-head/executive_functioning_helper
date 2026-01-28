from typing import AsyncIterator
import httpx

from app.llm.base import LLMProvider, Message, LLMResponse
from app.core.config import get_settings

settings = get_settings()


class OllamaProvider(LLMProvider):
    def __init__(self, base_url: str | None = None, model: str | None = None):
        self.base_url = base_url or settings.ollama_base_url
        self.model = model or settings.ollama_model

    @property
    def name(self) -> str:
        return "ollama"

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

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": api_messages,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens,
                    },
                },
                timeout=120.0,
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
                async for line in response.aiter_lines():
                    if line:
                        data = json.loads(line)
                        if "message" in data and "content" in data["message"]:
                            yield data["message"]["content"]
