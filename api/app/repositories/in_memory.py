from __future__ import annotations

from .base import ProfileRepository, KnowledgeRepository, LogRepository
from ..metadata.store import StoreMetadata
from ..schemas.profile import Profile
from ..schemas.knowledge import Knowledge


class InMemoryProfileRepo(ProfileRepository):
    def __init__(self) -> None:
        self._profile = Profile()

    def get(self) -> Profile:
        perfil = self._profile
        return perfil

    def set(self, profile: Profile) -> Profile:
        self._profile = profile
        return self._profile

class InMemoryKnowledgeRepo(KnowledgeRepository):
    def __init__(self) -> None:
        self._knowledge = Knowledge()

    def get(self) -> Knowledge:
        conocimiento = self._knowledge
        return conocimiento

    def set(self, knowledge: Knowledge) -> Knowledge:
        self._knowledge = knowledge
        return self._knowledge

class InMemoryLogRepo(LogRepository):
    def __init__(
        self,
        max_items: int = StoreMetadata.default_logs_max_items,
    ) -> None:
        self._max = max_items
        self._items: list = []

    def add(self, event: dict) -> None:
        self._items.append(event)
        if len(self._items) > self._max:
            self._items.pop(0)

    def list(self) -> list:
        items = list(self._items)
        return items
