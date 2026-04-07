from datetime import datetime, timezone

from ..repositories.base import LogRepository
from ..schemas.logs import LogEvent


class LogService:
    def __init__(self, repo: LogRepository) -> None:
        self._repo = repo

    def add_event(self, user_id: int, payload: LogEvent) -> dict:
        event = payload.model_dump()
        event['ts'] = event.get('ts') or datetime.now(timezone.utc).isoformat()
        # Nota: por buenas prácticas, aquí NO guardamos valores sensibles (solo meta).
        self._repo.add(user_id, event)
        respuesta = {'ok': True}
        return respuesta

    def list_events(self, user_id: int) -> list:
        eventos = self._repo.list(user_id)
        return eventos
