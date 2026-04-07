from __future__ import annotations

import json
from pathlib import Path

from .base import KnowledgeRepository, LogRepository, ProfileRepository
from ..metadata.store import StoreMetadata
from ..schemas.knowledge import Knowledge
from ..schemas.profile import Profile


class JsonFileStore:
    def __init__(self, file_path: Path) -> None:
        self._path = file_path
        self._path.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> dict:
        data = self._default_payload()
        if self._path.exists():
            try:
                loaded_data = json.loads(self._path.read_text(encoding='utf-8'))
                data = {
                    'profile': loaded_data.get('profile') or Profile().model_dump(),
                    'knowledge': loaded_data.get('knowledge') or Knowledge().model_dump(),
                    'logs': loaded_data.get('logs') or [],
                }
            except (json.JSONDecodeError, OSError):
                data = self._default_payload()

        return data

    def save(self, payload: dict) -> None:
        tmp_path = self._path.with_suffix('.tmp')
        tmp_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding='utf-8',
        )
        tmp_path.replace(self._path)

    @staticmethod
    def _default_payload() -> dict:
        payload = {
            'profile': Profile().model_dump(),
            'knowledge': Knowledge().model_dump(),
            'logs': [],
        }
        return payload


class JsonFileProfileRepo(ProfileRepository):
    def __init__(self, store: JsonFileStore) -> None:
        self._store = store

    def get(self) -> Profile:
        data = self._store.load()
        profile = Profile.model_validate(data['profile'])
        return profile

    def set(self, profile: Profile) -> Profile:
        data = self._store.load()
        data['profile'] = profile.model_dump()
        self._store.save(data)
        return profile


class JsonFileKnowledgeRepo(KnowledgeRepository):
    def __init__(self, store: JsonFileStore) -> None:
        self._store = store

    def get(self) -> Knowledge:
        data = self._store.load()
        knowledge = Knowledge.model_validate(data['knowledge'])
        return knowledge

    def set(self, knowledge: Knowledge) -> Knowledge:
        data = self._store.load()
        data['knowledge'] = knowledge.model_dump()
        self._store.save(data)
        return knowledge


class JsonFileLogRepo(LogRepository):
    def __init__(
        self,
        store: JsonFileStore,
        max_items: int = StoreMetadata.default_logs_max_items,
    ) -> None:
        self._store = store
        self._max_items = max_items

    def add(self, event: dict) -> None:
        data = self._store.load()
        logs = data['logs']
        logs.append(event)
        if len(logs) > self._max_items:
            logs = logs[-self._max_items :]
        data['logs'] = logs
        self._store.save(data)

    def list(self) -> list:
        data = self._store.load()
        logs = list(data['logs'])
        return logs
