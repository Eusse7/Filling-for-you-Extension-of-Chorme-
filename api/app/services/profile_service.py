from ..repositories.base import ProfileRepository
from ..schemas.profile import Profile

class ProfileService:
    def __init__(self, repo: ProfileRepository) -> None:
        self._repo = repo

    def get_profile(self, user_id: int) -> Profile:
        perfil = self._repo.get(user_id)
        if perfil is None:
            return Profile()

        if isinstance(perfil, Profile):
            return perfil

        try:
            return Profile.model_validate(perfil)
        except Exception:
            return Profile()

    def update_profile(self, user_id: int, profile: Profile) -> Profile:
        perfil_actualizado = self._repo.set(user_id, profile)
        return perfil_actualizado
