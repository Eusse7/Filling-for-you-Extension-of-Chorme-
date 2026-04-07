from ..repositories.base import KnowledgeRepository
from ..schemas.knowledge import Knowledge

class KnowledgeService:
    def __init__(self, repo: KnowledgeRepository) -> None:
        self._repo = repo

    def get_knowledge(self, user_id: int) -> Knowledge:
        conocimiento = self._repo.get(user_id)
        if conocimiento is None:
            return Knowledge()

        if isinstance(conocimiento, Knowledge):
            return conocimiento

        try:
            return Knowledge.model_validate(conocimiento)
        except Exception:
            return Knowledge()

    def update_knowledge(self, user_id: int, knowledge: Knowledge) -> Knowledge:
        conocimiento_actualizado = self._repo.set(user_id, knowledge)
        return conocimiento_actualizado
