from fastapi import Header, HTTPException
from .auth import AuthUser, decode_access_token


def require_auth(authorization: str | None = Header(default=None)) -> AuthUser:
    """Valida Bearer JWT y retorna el usuario autenticado.

    Args:
        authorization: Header Authorization recibido en la petición.

    Raises:
        HTTPException: Si falta o es inválido el token.
    """
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Unauthorized')

    token = authorization.removeprefix('Bearer ').strip()
    if not token:
        raise HTTPException(status_code=401, detail='Unauthorized')

    try:
        return decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail='Unauthorized')
