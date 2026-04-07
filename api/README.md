# API (FastAPI) - versión refactor (capas)

## Ejecutar
```bash
cd api
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 3000
```

Endpoints:
- POST `/auth/register`
- POST `/auth/login`
- GET `/auth/me`
- GET/PUT `/profile`
- GET/PUT `/knowledge`
- POST `/logs`
- GET `/logs`
- GET `/health`

Persistencia:
- Los datos de `profile`, `knowledge` y `logs` se guardan en PostgreSQL.
- Estructura principal:
	- `users`
	- `user_profiles`
	- `user_knowledge`
	- `app_logs`

Variables de entorno útiles:
- `DATABASE_URL`: URL SQLAlchemy (ejemplo `postgresql+psycopg://autofill:autofill@db:5432/autofill`)
- `JWT_SECRET`: secreto para firmar los access tokens JWT
- `JWT_ALGORITHM`: algoritmo JWT (default `HS256`)
- `JWT_EXP_MINUTES`: tiempo de expiración del token en minutos
