from fastapi import HTTPException
from ..repositories.base import BlacklistRepository
from ..schemas.blacklist import BlacklistCreate, BlacklistResponse

class BlacklistService:
    def __init__(self, repo: BlacklistRepository) -> None:
        self._repo = repo

    def add(self, user_id: int, payload: BlacklistCreate) -> BlacklistResponse:
        current = self._repo.list(user_id)
        if len(current) >= 10:
            raise HTTPException(status_code=400, detail="Límite máximo de 10 sitios alcanzado en la lista negra")
        
        if any(b.domain.lower() == payload.domain.lower().strip() for b in current):
            raise HTTPException(status_code=400, detail="El sitio ya está en la lista")

        return self._repo.add(user_id, payload.domain.lower().strip())

    def get_all(self, user_id: int) -> list[BlacklistResponse]:
        return self._repo.list(user_id)
        
    def delete(self, user_id: int, item_id: int) -> bool:
        success = self._repo.delete(user_id, item_id)
        if not success:
            raise HTTPException(status_code=404, detail="Sitio no encontrado")
        return True