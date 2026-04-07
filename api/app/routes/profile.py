from typing import Annotated
from fastapi import APIRouter, Depends
from ..core.auth import AuthUser
from ..core.dependencies import get_profile_service
from ..core.security import require_auth
from ..schemas.profile import Profile
from ..services.profile_service import ProfileService

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("")
def get_profile(
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    svc: Annotated[ProfileService, Depends(get_profile_service)],
) -> Profile:
    """Obtiene el perfil del candidato autenticado."""
    perfil = svc.get_profile(auth_user.user_id)
    return perfil


@router.put("")
def put_profile(
    payload: Profile,
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    svc: Annotated[ProfileService, Depends(get_profile_service)],
) -> Profile:
    """Actualiza y retorna el perfil del candidato."""
    perfil_actualizado = svc.update_profile(auth_user.user_id, payload)
    return perfil_actualizado
