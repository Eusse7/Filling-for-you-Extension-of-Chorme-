from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from .base import KnowledgeRepository, LogRepository, ProfileRepository
from .json_file import JsonFileStore
from ..metadata.store import StoreMetadata
from ..schemas.knowledge import Knowledge
from ..schemas.profile import Profile


class SQLiteStore:
    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _initialize(self) -> None:
        with self._connect() as conn:
            conn.execute('PRAGMA journal_mode=WAL;')
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS kv_store (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event TEXT NOT NULL,
                    ts TEXT
                )
                """
            )
            conn.commit()

    def migrate_from_json_if_needed(self, json_path: Path) -> None:
        debe_migrar = True
        with self._connect() as conn:
            existing_profile = conn.execute(
                "SELECT 1 FROM kv_store WHERE key = 'profile'"
            ).fetchone()
            existing_knowledge = conn.execute(
                "SELECT 1 FROM kv_store WHERE key = 'knowledge'"
            ).fetchone()
            has_logs = conn.execute('SELECT 1 FROM logs LIMIT 1').fetchone()

            if existing_profile and existing_knowledge and has_logs:
                debe_migrar = False

        if debe_migrar:
            store = JsonFileStore(json_path)
            payload = store.load()
            profile = Profile.model_validate(payload.get('profile') or {}).model_dump()
            knowledge = Knowledge.model_validate(payload.get('knowledge') or {}).model_dump()
            logs = payload.get('logs') or []

            with self._connect() as conn:
                conn.execute(
                    StoreMetadata.upsert_kv_sql,
                    ('profile', json.dumps(profile, ensure_ascii=False)),
                )
                conn.execute(
                    StoreMetadata.upsert_kv_sql,
                    ('knowledge', json.dumps(knowledge, ensure_ascii=False)),
                )

                if logs:
                    conn.executemany(
                        "INSERT INTO logs(event, ts) VALUES(?, ?)",
                        [
                            (
                                json.dumps(event, ensure_ascii=False),
                                (event or {}).get('ts'),
                            )
                            for event in logs
                        ],
                    )
                conn.commit()

    def get_json_value(self, key: str, default_value: dict) -> dict:
        payload = default_value
        with self._connect() as conn:
            row = conn.execute('SELECT value FROM kv_store WHERE key = ?', (key,)).fetchone()

        if row:
            try:
                parsed = json.loads(row['value'])
                if isinstance(parsed, dict):
                    payload = parsed
            except json.JSONDecodeError:
                payload = default_value

        return payload

    def set_json_value(self, key: str, value: dict) -> None:
        payload = json.dumps(value, ensure_ascii=False)
        with self._connect() as conn:
            conn.execute(
                StoreMetadata.upsert_kv_sql,
                (key, payload),
            )
            conn.commit()

    def add_log(self, event: dict) -> None:
        payload = json.dumps(event, ensure_ascii=False)
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO logs(event, ts) VALUES(?, ?)",
                (payload, event.get('ts')),
            )
            conn.commit()

    def list_logs(self, max_items: int) -> list:
        with self._connect() as conn:
            rows = conn.execute(
                'SELECT event FROM logs ORDER BY id DESC LIMIT ?', (max_items,)
            ).fetchall()

        # Preserva orden cronológico (ascendente) en respuesta.
        items = []
        for row in reversed(rows):
            try:
                event = json.loads(row['event'])
                if isinstance(event, dict):
                    items.append(event)
            except json.JSONDecodeError:
                continue

        return items

    def trim_logs(self, max_items: int) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                DELETE FROM logs
                WHERE id NOT IN (
                    SELECT id FROM logs ORDER BY id DESC LIMIT ?
                )
                """,
                (max_items,),
            )
            conn.commit()


class SQLiteProfileRepo(ProfileRepository):
    def __init__(self, store: SQLiteStore) -> None:
        self._store = store

    def get(self) -> Profile:
        raw = self._store.get_json_value('profile', Profile().model_dump())
        profile = Profile.model_validate(raw)
        return profile

    def set(self, profile: Profile) -> Profile:
        self._store.set_json_value('profile', profile.model_dump())
        return profile


class SQLiteKnowledgeRepo(KnowledgeRepository):
    def __init__(self, store: SQLiteStore) -> None:
        self._store = store

    def get(self) -> Knowledge:
        raw = self._store.get_json_value('knowledge', Knowledge().model_dump())
        knowledge = Knowledge.model_validate(raw)
        return knowledge

    def set(self, knowledge: Knowledge) -> Knowledge:
        self._store.set_json_value('knowledge', knowledge.model_dump())
        return knowledge


class SQLiteLogRepo(LogRepository):
    def __init__(
        self,
        store: SQLiteStore,
        max_items: int = StoreMetadata.default_logs_max_items,
    ) -> None:
        self._store = store
        self._max_items = max_items

    def add(self, event: dict) -> None:
        self._store.add_log(event)
        self._store.trim_logs(self._max_items)

    def list(self) -> list:
        logs = self._store.list_logs(self._max_items)
        return logs
