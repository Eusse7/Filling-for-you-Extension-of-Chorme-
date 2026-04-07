from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from sqlalchemy import select

from ..core.auth import AuthUser, create_access_token
from ..core.dependencies import get_postgres_store
from ..core.security import require_auth
from ..repositories.postgres import PostgresStore
from ..schemas.auth import AuthResponse, LoginRequest, MeResponse, RegisterRequest
from ..schemas.knowledge import Knowledge
from ..schemas.profile import Profile
from ..storage.models import User, UserKnowledge, UserProfile

pwd_context = CryptContext(schemes=['pbkdf2_sha256'], deprecated='auto')

router = APIRouter(prefix='/auth', tags=['auth'])


def _ensure_defaults_for_user(session, user_id: int) -> None:
    default_profile = Profile()
    default_knowledge = Knowledge()

    profile_row = session.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
    if not profile_row:
        session.add(
            UserProfile(
                user_id=user_id,
                phone=default_profile.phone,
                address_line1=default_profile.addressLine1,
                city=default_profile.city,
                country=default_profile.country,
                linkedin=default_profile.linkedin,
                github=default_profile.github,
            )
        )

    knowledge_row = session.scalar(select(UserKnowledge).where(UserKnowledge.user_id == user_id))
    if not knowledge_row:
        session.add(
            UserKnowledge(
                user_id=user_id,
                about_me=default_knowledge.about_me,
                strengths=default_knowledge.strengths,
                salary_expectation=default_knowledge.salary_expectation,
                cover_letter=default_knowledge.cover_letter,
            )
        )


@router.post('/register', responses={409: {'description': 'Email already exists'}})
def register(
    payload: RegisterRequest,
    store: Annotated[PostgresStore, Depends(get_postgres_store)],
) -> AuthResponse:
    with store.new_session() as session:
        existing = session.scalar(select(User).where(User.email == payload.email))
        if existing:
            raise HTTPException(status_code=409, detail='Email already exists')

        user = User(
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            password_hash=pwd_context.hash(payload.password),
        )
        session.add(user)
        session.flush()

        _ensure_defaults_for_user(session, user.id)
        session.commit()

    token = create_access_token(user.id, user.email)
    return AuthResponse(access_token=token)


@router.post('/login', responses={401: {'description': 'Invalid credentials'}})
def login(
    payload: LoginRequest,
    store: Annotated[PostgresStore, Depends(get_postgres_store)],
) -> AuthResponse:
    with store.new_session() as session:
        user = session.scalar(select(User).where(User.email == payload.email))
        if not user or not pwd_context.verify(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail='Invalid credentials')

        _ensure_defaults_for_user(session, user.id)
        session.commit()

    token = create_access_token(user.id, user.email)
    return AuthResponse(access_token=token)


@router.get('/me', responses={404: {'description': 'User not found'}})
def me(
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    store: Annotated[PostgresStore, Depends(get_postgres_store)],
) -> MeResponse:
    with store.new_session() as session:
        user = session.scalar(select(User).where(User.id == auth_user.user_id))
        if not user:
            raise HTTPException(status_code=404, detail='User not found')

        result = MeResponse(
            user_id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
        )
    return result
