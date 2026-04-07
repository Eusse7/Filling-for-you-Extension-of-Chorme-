from fastapi import Header, HTTPException
from .config import settings


def require_auth(authorization: str | None = Header(default=None)) -> str:
    """Valida el token Bearer de demostración enviado en Authorization.

    Args:
        authorization: Header Authorization recibido en la petición.

    Returns:
        El valor del header Authorization validado.

    Raises:
        HTTPException: Si el token es inválido o no fue enviado.
    """
    if authorization != f'Bearer {settings.demo_token}':
        raise HTTPException(status_code=401, detail='Unauthorized')

    return authorization
