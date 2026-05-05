from typing import Annotated

from fastapi import APIRouter, Depends

from ..core.auth import AuthUser
from ..core.dependencies import get_history_service
from ..core.security import require_auth
from ..schemas.history import AutofillHistoryCreate, AutofillHistoryResponse
from ..services.history_service import HistoryService

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[AutofillHistoryResponse])
def get_history(
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    history_service: Annotated[HistoryService, Depends(get_history_service)],
) -> list[AutofillHistoryResponse]:
    return history_service.get_user_history(auth_user.user_id)


@router.post("", response_model=AutofillHistoryResponse)
def record_history(
    payload: AutofillHistoryCreate,
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    history_service: Annotated[HistoryService, Depends(get_history_service)],
) -> AutofillHistoryResponse:
    return history_service.record_history(auth_user.user_id, payload)

