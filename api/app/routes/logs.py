from typing import Annotated

from fastapi import APIRouter, Depends
from ..core.auth import AuthUser
from ..core.dependencies import get_log_service
from ..core.security import require_auth
from ..schemas.logs import LogEvent
from ..services.log_service import LogService

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("")
def post_logs(
    payload: LogEvent,
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    svc: Annotated[LogService, Depends(get_log_service)],
) -> dict:
    """Registra un evento de bitácora."""
    resultado = svc.add_event(auth_user.user_id, payload)
    return resultado


@router.get("")
def get_logs(
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    svc: Annotated[LogService, Depends(get_log_service)],
) -> list:
    """Lista eventos de bitácora persistidos."""
    eventos = svc.list_events(auth_user.user_id)
    return eventos
