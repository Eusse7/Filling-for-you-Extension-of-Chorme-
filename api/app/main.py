from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .core.dependencies import (
    get_knowledge_service,
    get_log_service,
    get_profile_service,
)
from .repositories.postgres import (
    PostgresKnowledgeRepo,
    PostgresLogRepo,
    PostgresProfileRepo,
    PostgresStore,
)
from .services.profile_service import ProfileService
from .services.knowledge_service import KnowledgeService
from .services.log_service import LogService

from .routes import logs as logs_routes
from .routes import knowledge as knowledge_routes
from .routes import profile as profile_routes

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
    profile_repo = PostgresProfileRepo(postgres_store, settings.bootstrap_user_email)
    knowledge_repo = PostgresKnowledgeRepo(postgres_store, settings.bootstrap_user_email)
    log_repo = PostgresLogRepo(postgres_store, settings.bootstrap_user_email)

    # Services
    profile_service = ProfileService(profile_repo)
    knowledge_service = KnowledgeService(knowledge_repo)
    log_service = LogService(log_repo)

    # Dependency overrides (DIP: rutas dependen de interfaces, aquí se inyecta impl concreta)
    app.dependency_overrides[get_profile_service] = lambda: profile_service
    app.dependency_overrides[get_knowledge_service] = lambda: knowledge_service
    app.dependency_overrides[get_log_service] = lambda: log_service

    # Routes
    app.include_router(profile_routes.router)
    app.include_router(knowledge_routes.router)
    app.include_router(logs_routes.router)

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
