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
- POST `/auth/password-reset/request`
- POST `/auth/password-reset/confirm`
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
- `SMTP_HOST`: servidor SMTP para envío de correos de recuperación
- `SMTP_PORT`: puerto SMTP
- `SMTP_USERNAME`: usuario SMTP opcional
- `SMTP_PASSWORD`: contraseña SMTP opcional
- `SMTP_FROM_EMAIL`: remitente del correo de recuperación
- `SMTP_USE_TLS`: `true` si el servidor requiere STARTTLS
- `PASSWORD_RESET_CODE_MINUTES`: expiración del código de recuperación
- `PASSWORD_RESET_CODE_MAX_ATTEMPTS`: intentos máximos antes de invalidar el código

Gmail SMTP (envío real):
- Activa 2FA en la cuenta Gmail.
- Genera una contraseña de aplicación (App Password).
- Configura estas variables:
	- `SMTP_HOST=smtp.gmail.com`
	- `SMTP_PORT=587`
	- `SMTP_USERNAME=tu_correo@gmail.com`
	- `SMTP_PASSWORD=tu_app_password`
	- `SMTP_FROM_EMAIL=tu_correo@gmail.com`
	- `SMTP_USE_TLS=true`

Desarrollo local con Docker:
- El archivo `docker-compose.yml` incluye `mailhog` para capturar los correos de recuperación.
- Interfaz web de MailHog: `http://localhost:8025`
