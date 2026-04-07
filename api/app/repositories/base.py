from typing import Protocol

from ..schemas.profile import Profile
from ..schemas.knowledge import Knowledge


class ProfileRepository(Protocol):
    def get(self) -> Profile: ...

    def set(self, profile: Profile) -> Profile: ...


class KnowledgeRepository(Protocol):
    def get(self) -> Knowledge: ...

    def set(self, knowledge: Knowledge) -> Knowledge: ...


class LogRepository(Protocol):
    def add(self, event: dict) -> None: ...

    def list(self) -> list: ...
