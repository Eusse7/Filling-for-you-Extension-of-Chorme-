from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt

from .config import settings


@dataclass
class AuthUser:
    user_id: int
    email: str


def create_access_token(user_id: int, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'sub': email,
        'uid': user_id,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(minutes=settings.jwt_exp_minutes)).timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token


def decode_access_token(token: str) -> AuthUser:
    data = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )
    user_id = int(data['uid'])
    email = str(data['sub'])
    return AuthUser(user_id=user_id, email=email)
