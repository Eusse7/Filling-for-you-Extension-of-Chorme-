from typing import Annotated

from fastapi import APIRouter, Depends
from ..core.dependencies import get_log_service
from ..core.security import require_auth
from ..schemas.logs import LogEvent
from ..services.log_service import LogService

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("")
def post_logs(
    payload: LogEvent,
    _: Annotated[str, Depends(require_auth)],
    svc: Annotated[LogService, Depends(get_log_service)],
) -> dict:
    """Registra un evento de bitácora."""
    resultado = svc.add_event(payload)
    return resultado


@router.get("")
def get_logs(
    _: Annotated[str, Depends(require_auth)],
    svc: Annotated[LogService, Depends(get_log_service)],
) -> list:
    """Lista eventos de bitácora persistidos."""
    eventos = svc.list_events()
    return eventos
