from typing import Annotated
from fastapi import APIRouter, Depends
from ..core.dependencies import get_profile_service
from ..core.security import require_auth
from ..schemas.profile import Profile
from ..services.profile_service import ProfileService

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("")
def get_profile(
    _: Annotated[str, Depends(require_auth)],
    svc: Annotated[ProfileService, Depends(get_profile_service)],
) -> Profile:
    """Obtiene el perfil del candidato autenticado por token demo."""
    perfil = svc.get_profile()
    return perfil


@router.put("")
def put_profile(
    payload: Profile,
    _: Annotated[str, Depends(require_auth)],
    svc: Annotated[ProfileService, Depends(get_profile_service)],
) -> Profile:
    """Actualiza y retorna el perfil del candidato."""
    perfil_actualizado = svc.update_profile(payload)
    return perfil_actualizado
