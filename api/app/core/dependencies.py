from ..services.knowledge_service import KnowledgeService
from ..services.log_service import LogService
from ..services.profile_service import ProfileService
from ..services.history_service import HistoryService
from ..services.blacklist_service import BlacklistService
from ..repositories.postgres import PostgresStore


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


def get_postgres_store() -> PostgresStore:
    """Obtiene el store PostgreSQL inyectado por la aplicación."""
    mensaje_error = 'PostgresStore dependency not overridden'
    raise RuntimeError(mensaje_error)
def get_history_service() -> HistoryService:
    """Obtiene el servicio de historico inyectado por la aplicacion."""
    mensaje_error = 'HistoryService dependency not overridden'
    raise RuntimeError(mensaje_error)

def get_blacklist_service() -> BlacklistService:
    """Obtiene el servicio de blacklist inyectado por la aplicacion."""
    mensaje_error = 'BlacklistService dependency not overridden'
    raise RuntimeError(mensaje_error)