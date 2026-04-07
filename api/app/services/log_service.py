from datetime import datetime, timezone

from ..repositories.base import LogRepository
from ..schemas.logs import LogEvent


class LogService:
    def __init__(self, repo: LogRepository) -> None:
        self._repo = repo

    def add_event(self, payload: LogEvent) -> dict:
        event = payload.model_dump()
        event['ts'] = event.get('ts') or datetime.now(timezone.utc).isoformat()
        # Nota: por buenas prácticas, aquí NO guardamos valores sensibles (solo meta).
        self._repo.add(event)
        respuesta = {'ok': True}
        return respuesta

    def list_events(self) -> list:
        eventos = self._repo.list()
        return eventos
