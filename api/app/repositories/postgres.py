from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session, sessionmaker

from .base import KnowledgeRepository, LogRepository, ProfileRepository, HistoryRepository, BlacklistRepository
from ..schemas.knowledge import Knowledge
from ..schemas.profile import Profile
from ..schemas.history import AutofillHistoryCreate, AutofillHistoryResponse
from ..schemas.blacklist import BlacklistResponse
from ..storage.models import AppLog, Base, User, UserKnowledge, UserProfile, UserAutofillHistory, UserBlacklist


class PostgresStore:
    def __init__(self, database_url: str) -> None:
        self._engine = create_engine(database_url, pool_pre_ping=True)
        self._session_factory = sessionmaker(bind=self._engine, expire_on_commit=False)

    def create_schema(self) -> None:
        Base.metadata.create_all(self._engine)

    def new_session(self) -> Session:
        return self._session_factory()

    def delete_user_account(self, user_id: int) -> bool:
        with self.new_session() as session:
            user = session.scalar(select(User).where(User.id == user_id))
            if not user:
                return False

            session.execute(delete(User).where(User.id == user_id))
            session.commit()
            return True


class PostgresProfileRepo(ProfileRepository):
    def __init__(self, store: PostgresStore) -> None:
        self._store = store

    @staticmethod
    def _ensure_default_profile(session: Session, user_id: int) -> UserProfile:
        profile_row = session.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
        if profile_row:
            return profile_row

        defaults = Profile()
        profile_row = UserProfile(
            user_id=user_id,
            phone=defaults.phone,
            address_line1=defaults.addressLine1,
            city=defaults.city,
            country=defaults.country,
            linkedin=defaults.linkedin,
            github=defaults.github,
        )
        session.add(profile_row)
        session.flush()
        return profile_row

    def get(self, user_id: int) -> Profile:
        with self._store.new_session() as session:
            user = session.scalar(select(User).where(User.id == user_id))
            if not user:
                return Profile()

            profile_row = self._ensure_default_profile(session, user.id)
            session.commit()

        return Profile(
            firstName=user.first_name,
            lastName=user.last_name,
            email=user.email,
            phone=profile_row.phone,
            addressLine1=profile_row.address_line1,
            city=profile_row.city,
            country=profile_row.country,
            linkedin=profile_row.linkedin,
            github=profile_row.github,
        )

    def set(self, user_id: int, profile: Profile) -> Profile:
        with self._store.new_session() as session:
            user = session.scalar(select(User).where(User.id == user_id))
            if not user:
                return Profile()

            user.first_name = profile.firstName
            user.last_name = profile.lastName
            user.email = profile.email
            user.updated_at = datetime.now(timezone.utc)

            profile_row = self._ensure_default_profile(session, user.id)
            profile_row.phone = profile.phone
            profile_row.address_line1 = profile.addressLine1
            profile_row.city = profile.city
            profile_row.country = profile.country
            profile_row.linkedin = profile.linkedin
            profile_row.github = profile.github
            profile_row.updated_at = datetime.now(timezone.utc)

            session.commit()

        return self.get(user_id)


class PostgresKnowledgeRepo(KnowledgeRepository):
    def __init__(self, store: PostgresStore) -> None:
        self._store = store

    @staticmethod
    def _ensure_default_knowledge(session: Session, user_id: int) -> UserKnowledge:
        knowledge_row = session.scalar(select(UserKnowledge).where(UserKnowledge.user_id == user_id))
        if knowledge_row:
            return knowledge_row

        defaults = Knowledge()
        knowledge_row = UserKnowledge(
            user_id=user_id,
            about_me=defaults.about_me,
            strengths=defaults.strengths,
            salary_expectation=defaults.salary_expectation,
            cover_letter=defaults.cover_letter,
        )
        session.add(knowledge_row)
        session.flush()
        return knowledge_row

    def get(self, user_id: int) -> Knowledge:
        with self._store.new_session() as session:
            user = session.scalar(select(User).where(User.id == user_id))
            if not user:
                return Knowledge()

            knowledge_row = self._ensure_default_knowledge(session, user.id)
            session.commit()

        return Knowledge(
            about_me=knowledge_row.about_me,
            strengths=knowledge_row.strengths,
            salary_expectation=knowledge_row.salary_expectation,
            cover_letter=knowledge_row.cover_letter,
        )

    def set(self, user_id: int, knowledge: Knowledge) -> Knowledge:
        with self._store.new_session() as session:
            user = session.scalar(select(User).where(User.id == user_id))
            if not user:
                return Knowledge()

            knowledge_row = self._ensure_default_knowledge(session, user.id)
            knowledge_row.about_me = knowledge.about_me
            knowledge_row.strengths = knowledge.strengths
            knowledge_row.salary_expectation = knowledge.salary_expectation
            knowledge_row.cover_letter = knowledge.cover_letter
            knowledge_row.updated_at = datetime.now(timezone.utc)
            session.commit()

        return self.get(user_id)


class PostgresLogRepo(LogRepository):
    def __init__(self, store: PostgresStore, max_items: int = 500) -> None:
        self._store = store
        self._max_items = max_items

    def add(self, user_id: int, event: dict) -> None:
        with self._store.new_session() as session:
            user = session.scalar(select(User).where(User.id == user_id))
            if not user:
                return

            session.add(
                AppLog(
                    user_id=user.id,
                    event_json=json.dumps(event, ensure_ascii=False),
                    ts=event.get('ts'),
                )
            )
            session.commit()

            ids = session.scalars(
                select(AppLog.id)
                .where(AppLog.user_id == user.id)
                .order_by(AppLog.id.desc())
                .offset(self._max_items)
            ).all()
            if ids:
                session.execute(delete(AppLog).where(AppLog.id.in_(ids)))
                session.commit()

    def list(self, user_id: int) -> list:
        with self._store.new_session() as session:
            rows = session.scalars(
                select(AppLog)
                .where(AppLog.user_id == user_id)
                .order_by(AppLog.id.desc())
                .limit(self._max_items)
            ).all()

        events = []
        for row in reversed(rows):
            try:
                events.append(json.loads(row.event_json))
            except json.JSONDecodeError:
                continue
        return events


class PostgresHistoryRepo(HistoryRepository):
    def __init__(self, store: PostgresStore) -> None:
        self._store = store

    def add(self, user_id: int, history: AutofillHistoryCreate) -> AutofillHistoryResponse:
        with self._store.new_session() as session:
            new_history = UserAutofillHistory(
                user_id=user_id,
                url=history.url,
                title=history.title,
            )
            session.add(new_history)
            session.commit()
            
            return AutofillHistoryResponse(
                id=new_history.id,
                url=new_history.url,
                title=new_history.title,
                filled_at=new_history.filled_at
            )

    def list(self, user_id: int, max_items: int = 10) -> list[AutofillHistoryResponse]:
        with self._store.new_session() as session:
            rows = session.scalars(
                select(UserAutofillHistory)
                .where(UserAutofillHistory.user_id == user_id)
                .order_by(UserAutofillHistory.filled_at.desc())
                .limit(max_items)
            ).all()

        return [
            AutofillHistoryResponse(
                id=row.id,
                url=row.url,
                title=row.title,
                filled_at=row.filled_at
            )
            for row in rows
        ]

class PostgresBlacklistRepo(BlacklistRepository):
    def __init__(self, store: PostgresStore) -> None:
        self._store = store

    def add(self, user_id: int, domain: str) -> BlacklistResponse:
        with self._store.new_session() as session:
            new_item = UserBlacklist(
                user_id=user_id,
                domain=domain,
            )
            session.add(new_item)
            session.commit()
            
            return BlacklistResponse(
                id=new_item.id,
                domain=new_item.domain,
                created_at=new_item.created_at
            )

    def list(self, user_id: int) -> list[BlacklistResponse]:
        with self._store.new_session() as session:
            rows = session.scalars(
                select(UserBlacklist)
                .where(UserBlacklist.user_id == user_id)
                .order_by(UserBlacklist.created_at.desc())
            ).all()

        return [
            BlacklistResponse(
                id=row.id,
                domain=row.domain,
                created_at=row.created_at
            )
            for row in rows
        ]

    def delete(self, user_id: int, item_id: int) -> bool:
        with self._store.new_session() as session:
            item = session.scalar(
                select(UserBlacklist)
                .where(UserBlacklist.user_id == user_id, UserBlacklist.id == item_id)
            )
            if not item:
                return False

            session.execute(delete(UserBlacklist).where(UserBlacklist.id == item_id))
            session.commit()
            return True
