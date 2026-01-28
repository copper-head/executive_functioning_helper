from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator


@dataclass
class Message:
    role: str
    content: str


@dataclass
class LLMResponse:
    content: str
    model: str
    finish_reason: str | None = None


class LLMProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        pass

    @abstractmethod
    async def chat_stream(
        self,
        messages: list[Message],
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass
