from typing import Annotated
from fastapi import APIRouter, Depends
from ..core.auth import AuthUser
from ..core.dependencies import get_knowledge_service
from ..core.security import require_auth
from ..schemas.knowledge import Knowledge
from ..services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("")
def get_knowledge(
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    svc: Annotated[KnowledgeService, Depends(get_knowledge_service)],
) -> Knowledge:
    """Obtiene el conocimiento base del candidato."""
    conocimiento = svc.get_knowledge(auth_user.user_id)
    return conocimiento


@router.put("")
def put_knowledge(
    payload: Knowledge,
    auth_user: Annotated[AuthUser, Depends(require_auth)],
    svc: Annotated[KnowledgeService, Depends(get_knowledge_service)],
) -> Knowledge:
    """Actualiza y retorna el conocimiento base del candidato."""
    conocimiento_actualizado = svc.update_knowledge(auth_user.user_id, payload)
    return conocimiento_actualizado
