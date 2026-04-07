from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


USERS_FK = 'users.id'


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey(USERS_FK, ondelete='CASCADE'),
        nullable=False,
        unique=True,
        index=True,
    )
    phone: Mapped[str] = mapped_column(String(80), nullable=False, default='')
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False, default='')
    city: Mapped[str] = mapped_column(String(120), nullable=False, default='')
    country: Mapped[str] = mapped_column(String(80), nullable=False, default='')
    linkedin: Mapped[str] = mapped_column(String(320), nullable=False, default='')
    github: Mapped[str] = mapped_column(String(320), nullable=False, default='')
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class UserKnowledge(Base):
    __tablename__ = 'user_knowledge'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey(USERS_FK, ondelete='CASCADE'),
        nullable=False,
        unique=True,
        index=True,
    )
    about_me: Mapped[str] = mapped_column(Text, nullable=False, default='')
    strengths: Mapped[str] = mapped_column(Text, nullable=False, default='')
    salary_expectation: Mapped[str] = mapped_column(Text, nullable=False, default='')
    cover_letter: Mapped[str] = mapped_column(Text, nullable=False, default='')
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class AppLog(Base):
    __tablename__ = 'app_logs'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey(USERS_FK, ondelete='CASCADE'), index=True)
    event_json: Mapped[str] = mapped_column(Text, nullable=False)
    ts: Mapped[str | None] = mapped_column(String(60), nullable=True)
