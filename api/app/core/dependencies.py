from ..services.knowledge_service import KnowledgeService
from ..services.log_service import LogService
from ..services.profile_service import ProfileService


def get_profile_service() -> ProfileService:
    """Obtiene el servicio de perfil inyectado por la aplicación.

    Raises:
        RuntimeError: Si el override de dependencia no fue configurado.
    """
    mensaje_error = 'ProfileService dependency not overridden'
    raise RuntimeError(mensaje_error)


def get_knowledge_service() -> KnowledgeService:
    """Obtiene el servicio de conocimiento inyectado por la aplicación.

    Raises:
        RuntimeError: Si el override de dependencia no fue configurado.
    """
    mensaje_error = 'KnowledgeService dependency not overridden'
    raise RuntimeError(mensaje_error)


def get_log_service() -> LogService:
    """Obtiene el servicio de logs inyectado por la aplicación.

    Raises:
        RuntimeError: Si el override de dependencia no fue configurado.
    """
    mensaje_error = 'LogService dependency not overridden'
    raise RuntimeError(mensaje_error)