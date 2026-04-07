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

Token demo: `demo-token`

Endpoints:
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
- `BOOTSTRAP_USER_EMAIL`: usuario inicial técnico para compatibilidad de endpoints actuales
