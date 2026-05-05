from typing import Annotated
from fastapi import APIRouter, Depends, Response
from ..core.auth import AuthUser
from ..core.dependencies import get_blacklist_service
from ..core.security import require_auth
from ..schemas.blacklist import BlacklistCreate, BlacklistResponse
from ..services.blacklist_service import BlacklistService

router = APIRouter(prefix="/blacklist", tags=["blacklist"])

@router.get("")
def get_blacklist(
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    blacklist_service: Annotated[BlacklistService, Depends(get_blacklist_service)],
) -> list[BlacklistResponse]:
    return blacklist_service.get_all(auth_user.user_id)

@router.post("")
def add_blacklist(
    payload: BlacklistCreate,
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    blacklist_service: Annotated[BlacklistService, Depends(get_blacklist_service)],
) -> BlacklistResponse:
    return blacklist_service.add(auth_user.user_id, payload)

@router.delete("/{item_id}", status_code=204)
def remove_blacklist(
    item_id: int,
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    blacklist_service: Annotated[BlacklistService, Depends(get_blacklist_service)],
) -> Response:
    blacklist_service.delete(auth_user.user_id, item_id)
    return Response(status_code=204)
