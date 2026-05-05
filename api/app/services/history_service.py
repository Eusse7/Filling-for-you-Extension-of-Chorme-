from ..repositories.base import HistoryRepository
from ..schemas.history import AutofillHistoryCreate, AutofillHistoryResponse

class HistoryService:
    def __init__(self, repo: HistoryRepository) -> None:
        self._repo = repo

    def record_history(self, user_id: int, history: AutofillHistoryCreate) -> AutofillHistoryResponse:
        return self._repo.add(user_id, history)

    def get_user_history(self, user_id: int) -> list[AutofillHistoryResponse]:
        return self._repo.list(user_id)

