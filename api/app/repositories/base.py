from typing import Protocol

from ..schemas.profile import Profile
from ..schemas.knowledge import Knowledge


class ProfileRepository(Protocol):
    def get(self, user_id: int) -> Profile: ...

    def set(self, user_id: int, profile: Profile) -> Profile: ...


class KnowledgeRepository(Protocol):
    def get(self, user_id: int) -> Knowledge: ...

    def set(self, user_id: int, knowledge: Knowledge) -> Knowledge: ...


class LogRepository(Protocol):
    def add(self, user_id: int, event: dict) -> None: ...

    def list(self, user_id: int) -> list: ...
