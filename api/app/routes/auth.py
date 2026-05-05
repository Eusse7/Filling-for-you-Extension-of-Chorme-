from __future__ import annotations

import secrets
from typing import Annotated
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from passlib.context import CryptContext
from sqlalchemy import delete, select

from ..core.config import settings
from ..core.auth import AuthUser, create_access_token
from ..core.email import send_password_reset_code
from ..core.dependencies import get_postgres_store
from ..core.security import require_auth
from ..repositories.postgres import PostgresStore
from ..schemas.auth import (
    AuthResponse,
    LoginRequest,
    MeResponse,
    PasswordResetConfirmRequest,
    PasswordResetConfirmResponse,
    PasswordResetRequest,
    PasswordResetRequestResponse,
    RegisterRequest,
)
from ..schemas.knowledge import Knowledge
from ..schemas.profile import Profile
from ..storage.models import PasswordResetCode, User, UserKnowledge, UserProfile

pwd_context = CryptContext(schemes=['pbkdf2_sha256'], deprecated='auto')

router = APIRouter(prefix='/auth', tags=['auth'])


def _ensure_defaults_for_user(session, user_id: int) -> None:
    default_profile = Profile()

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
        default_knowledge = Knowledge()
        session.add(
            UserKnowledge(
                user_id=user_id,
                about_me=default_knowledge.about_me,
                strengths=default_knowledge.strengths,
                salary_expectation=default_knowledge.salary_expectation,
                cover_letter=default_knowledge.cover_letter,
            )
        )


def _generate_reset_code() -> str:
    return f'{secrets.randbelow(1_000_000):06d}'


def _create_password_reset_code(session, user_id: int) -> str:
    session.execute(delete(PasswordResetCode).where(PasswordResetCode.user_id == user_id))

    code = _generate_reset_code()
    now = datetime.now(timezone.utc)
    session.add(
        PasswordResetCode(
            user_id=user_id,
            code_hash=pwd_context.hash(code),
            expires_at=now + timedelta(minutes=settings.password_reset_code_minutes),
            attempts=0,
        )
    )
    return code


def _get_active_reset_code(session, user_id: int) -> PasswordResetCode | None:
    now = datetime.now(timezone.utc)
    return session.scalar(
        select(PasswordResetCode)
        .where(
            PasswordResetCode.user_id == user_id,
            PasswordResetCode.consumed_at.is_(None),
            PasswordResetCode.expires_at > now,
        )
        .order_by(PasswordResetCode.id.desc())
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


@router.post(
    '/password-reset/request',
    responses={503: {'description': 'Unable to send recovery email'}},
)
def request_password_reset(
    payload: PasswordResetRequest,
    store: Annotated[PostgresStore, Depends(get_postgres_store)],
) -> PasswordResetRequestResponse:
    with store.new_session() as session:
        user = session.scalar(select(User).where(User.email == payload.email))
        if not user:
            return PasswordResetRequestResponse()

        code = _create_password_reset_code(session, user.id)
        session.commit()

    try:
        send_password_reset_code(user.email, code)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f'No se pudo enviar el correo de recuperación: {exc}')

    return PasswordResetRequestResponse()


@router.post(
    '/password-reset/confirm',
    responses={400: {'description': 'Invalid, expired or already used code'}},
)
def confirm_password_reset(
    payload: PasswordResetConfirmRequest,
    store: Annotated[PostgresStore, Depends(get_postgres_store)],
) -> PasswordResetConfirmResponse:
    with store.new_session() as session:
        user = session.scalar(select(User).where(User.email == payload.email))
        if not user:
            raise HTTPException(status_code=400, detail='Código o correo inválido')

        reset_code = _get_active_reset_code(session, user.id)
        if not reset_code:
            raise HTTPException(status_code=400, detail='El código expiró o ya fue utilizado')

        if reset_code.attempts >= settings.password_reset_code_max_attempts:
            reset_code.consumed_at = datetime.now(timezone.utc)
            reset_code.updated_at = datetime.now(timezone.utc)
            session.commit()
            raise HTTPException(status_code=400, detail='El código expiró o ya fue utilizado')

        if not pwd_context.verify(payload.code.strip(), reset_code.code_hash):
            reset_code.attempts += 1
            reset_code.updated_at = datetime.now(timezone.utc)
            if reset_code.attempts >= settings.password_reset_code_max_attempts:
                reset_code.consumed_at = datetime.now(timezone.utc)
            session.commit()
            raise HTTPException(status_code=400, detail='Código o correo inválido')

        user.password_hash = pwd_context.hash(payload.new_password)
        user.updated_at = datetime.now(timezone.utc)

        reset_code.consumed_at = datetime.now(timezone.utc)
        reset_code.updated_at = datetime.now(timezone.utc)
        session.commit()

    return PasswordResetConfirmResponse()


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


@router.delete('/me', status_code=204, responses={404: {'description': 'User not found'}})
def delete_me(
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    store: Annotated[PostgresStore, Depends(get_postgres_store)],
) -> Response:
    deleted = store.delete_user_account(auth_user.user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail='User not found')
    return Response(status_code=204)
