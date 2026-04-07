from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session, sessionmaker

from .base import KnowledgeRepository, LogRepository, ProfileRepository
from ..schemas.knowledge import Knowledge
from ..schemas.profile import Profile
from ..storage.models import AppLog, Base, User, UserKnowledge, UserProfile


class PostgresStore:
    def __init__(self, database_url: str) -> None:
        self._engine = create_engine(database_url, pool_pre_ping=True)
        self._session_factory = sessionmaker(bind=self._engine, expire_on_commit=False)

    def create_schema(self) -> None:
        Base.metadata.create_all(self._engine)

    def new_session(self) -> Session:
        return self._session_factory()


class PostgresProfileRepo(ProfileRepository):
    def __init__(self, store: PostgresStore, bootstrap_email: str) -> None:
        self._store = store
        self._bootstrap_email = bootstrap_email

    def _ensure_bootstrap_user(self, session: Session) -> User:
        query = select(User).where(User.email == self._bootstrap_email)
        user = session.scalar(query)
        default_profile = Profile()
        default_knowledge = Knowledge()

        if not user:
            user = User(
                first_name=default_profile.firstName,
                last_name=default_profile.lastName,
                email=self._bootstrap_email,
                password_hash='demo-password-not-for-production',
            )
            session.add(user)
            session.flush()

        profile_row = session.scalar(
            select(UserProfile).where(UserProfile.user_id == user.id)
        )
        if not profile_row:
            session.add(
                UserProfile(
                    user_id=user.id,
                    phone=default_profile.phone,
                    address_line1=default_profile.addressLine1,
                    city=default_profile.city,
                    country=default_profile.country,
                    linkedin=default_profile.linkedin,
                    github=default_profile.github,
                )
            )

        knowledge_row = session.scalar(
            select(UserKnowledge).where(UserKnowledge.user_id == user.id)
        )
        if not knowledge_row:
            session.add(
                UserKnowledge(
                    user_id=user.id,
                    about_me=default_knowledge.about_me,
                    strengths=default_knowledge.strengths,
                    salary_expectation=default_knowledge.salary_expectation,
                    cover_letter=default_knowledge.cover_letter,
                )
            )

        session.flush()
        return user

    def get(self) -> Profile:
        with self._store.new_session() as session:
            user = self._ensure_bootstrap_user(session)
            profile_row = session.scalar(
                select(UserProfile).where(UserProfile.user_id == user.id)
            )
            session.commit()

        profile = Profile(
            firstName=user.first_name,
            lastName=user.last_name,
            email=user.email,
            phone=(profile_row.phone if profile_row else ''),
            addressLine1=(profile_row.address_line1 if profile_row else ''),
            city=(profile_row.city if profile_row else ''),
            country=(profile_row.country if profile_row else ''),
            linkedin=(profile_row.linkedin if profile_row else ''),
            github=(profile_row.github if profile_row else ''),
        )
        return profile

    def set(self, profile: Profile) -> Profile:
        with self._store.new_session() as session:
            user = self._ensure_bootstrap_user(session)
            user.first_name = profile.firstName
            user.last_name = profile.lastName
            user.email = profile.email
            user.updated_at = datetime.now(timezone.utc)

            profile_row = session.scalar(
                select(UserProfile).where(UserProfile.user_id == user.id)
            )
            if not profile_row:
                profile_row = UserProfile(user_id=user.id)
                session.add(profile_row)
                session.flush()

            profile_row.phone = profile.phone
            profile_row.address_line1 = profile.addressLine1
            profile_row.city = profile.city
            profile_row.country = profile.country
            profile_row.linkedin = profile.linkedin
            profile_row.github = profile.github
            profile_row.updated_at = datetime.now(timezone.utc)

            session.commit()

        return profile


class PostgresKnowledgeRepo(KnowledgeRepository):
    def __init__(self, store: PostgresStore, bootstrap_email: str) -> None:
        self._store = store
        self._profile_repo = PostgresProfileRepo(store, bootstrap_email)

    def get(self) -> Knowledge:
        with self._store.new_session() as session:
            user = self._profile_repo._ensure_bootstrap_user(session)
            knowledge_row = session.scalar(
                select(UserKnowledge).where(UserKnowledge.user_id == user.id)
            )
            session.commit()

        default_knowledge = Knowledge()
        knowledge = Knowledge(
            about_me=(knowledge_row.about_me if knowledge_row else default_knowledge.about_me),
            strengths=(knowledge_row.strengths if knowledge_row else default_knowledge.strengths),
            salary_expectation=(
                knowledge_row.salary_expectation
                if knowledge_row
                else default_knowledge.salary_expectation
            ),
            cover_letter=(knowledge_row.cover_letter if knowledge_row else default_knowledge.cover_letter),
        )
        return knowledge

    def set(self, knowledge: Knowledge) -> Knowledge:
        with self._store.new_session() as session:
            user = self._profile_repo._ensure_bootstrap_user(session)

            knowledge_row = session.scalar(
                select(UserKnowledge).where(UserKnowledge.user_id == user.id)
            )
            if not knowledge_row:
                knowledge_row = UserKnowledge(user_id=user.id)
                session.add(knowledge_row)
                session.flush()

            knowledge_row.about_me = knowledge.about_me
            knowledge_row.strengths = knowledge.strengths
            knowledge_row.salary_expectation = knowledge.salary_expectation
            knowledge_row.cover_letter = knowledge.cover_letter
            knowledge_row.updated_at = datetime.now(timezone.utc)

            session.commit()

        return knowledge


class PostgresLogRepo(LogRepository):
    def __init__(self, store: PostgresStore, bootstrap_email: str, max_items: int = 500) -> None:
        self._store = store
        self._profile_repo = PostgresProfileRepo(store, bootstrap_email)
        self._max_items = max_items

    def add(self, event: dict) -> None:
        with self._store.new_session() as session:
            user = self._profile_repo._ensure_bootstrap_user(session)
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

    def list(self) -> list:
        with self._store.new_session() as session:
            user = self._profile_repo._ensure_bootstrap_user(session)
            rows = session.scalars(
                select(AppLog)
                .where(AppLog.user_id == user.id)
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
