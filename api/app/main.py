from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .core.dependencies import (
    get_knowledge_service,
    get_log_service,
    get_history_service,
    get_blacklist_service,
    get_postgres_store,
    get_profile_service,
)
from .repositories.postgres import (
    PostgresKnowledgeRepo,
    PostgresLogRepo,
    PostgresProfileRepo,
    PostgresHistoryRepo,
    PostgresBlacklistRepo,
    PostgresStore,
)
from .services.profile_service import ProfileService
from .services.knowledge_service import KnowledgeService
from .services.history_service import HistoryService
from .services.blacklist_service import BlacklistService
from .services.log_service import LogService

from .routes import auth as auth_routes
from .routes import logs as logs_routes
from .routes import knowledge as knowledge_routes
from .routes import profile as profile_routes
from .routes import history as history_routes
from .routes import blacklist as blacklist_routes

def create_app() -> FastAPI:
    app = FastAPI(title='Autofill', version='0.2.0')

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_origin_regex=settings.allowed_origin_regex,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    postgres_store = PostgresStore(settings.database_url)
    postgres_store.create_schema()
    profile_repo = PostgresProfileRepo(postgres_store)
    knowledge_repo = PostgresKnowledgeRepo(postgres_store)
    log_repo = PostgresLogRepo(postgres_store)
    history_repo = PostgresHistoryRepo(postgres_store)
    blacklist_repo = PostgresBlacklistRepo(postgres_store)

    # Services
    profile_service = ProfileService(profile_repo)
    knowledge_service = KnowledgeService(knowledge_repo)
    log_service = LogService(log_repo)
    history_service = HistoryService(history_repo)
    blacklist_service = BlacklistService(blacklist_repo)

    # Dependency overrides (DIP: rutas dependen de interfaces, aquÃ se inyecta impl concreta)
    app.dependency_overrides[get_profile_service] = lambda: profile_service
    app.dependency_overrides[get_knowledge_service] = lambda: knowledge_service
    app.dependency_overrides[get_log_service] = lambda: log_service
    app.dependency_overrides[get_history_service] = lambda: history_service
    app.dependency_overrides[get_blacklist_service] = lambda: blacklist_service
    app.dependency_overrides[get_postgres_store] = lambda: postgres_store

    # Routes
    app.include_router(auth_routes.router)
    app.include_router(profile_routes.router)
    app.include_router(knowledge_routes.router)
    app.include_router(logs_routes.router)
    app.include_router(history_routes.router)
    app.include_router(blacklist_routes.router)

    @app.get('/health')
    def health() -> dict:
        respuesta = {'ok': True, 'time': datetime.now(timezone.utc).isoformat()}
        return respuesta

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={'detail': f'Internal server error: {str(exc)}'},
        )

    return app

app = create_app()
