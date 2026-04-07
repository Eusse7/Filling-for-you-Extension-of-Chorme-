# Demo: Extensión de autocompletado (Chrome/Edge) + React + FastAPI


- Extensión:
  - `content/` (scan, classify, plan, overlay, apply, submitGuard)
  - `background/` (apiClient, storage, logStore)
  - `popup/` (UI)
- API FastAPI:
  - `routes/` + `services/` + `repositories/` + `schemas/` + `core/`
- Web React:
  - `features/` (profile, knowledge), `pages/`, `components/`

## 1) Levantar backend (FastAPI)
```bash
cd api
python -m venv venv
# Windows: venv\Scripts\activate
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 3000
```

El backend usa una única base de datos PostgreSQL para local y producción.

## 2) Levantar web (React)
```bash
cd web
npm install
npm run dev
```
Abre: http://localhost:5173

## 3) Cargar la extensión (Chrome/Edge)
- Chrome: `chrome://extensions` -> Developer mode -> Load unpacked -> carpeta `extension`
- Edge: `edge://extensions` -> Developer mode -> Load unpacked -> carpeta `extension`

## 4) Probar
- En http://localhost:5173 actualiza **Perfil** y **Conocimiento**
- Para pruebas de autollenado abre: http://localhost:5173/form-test.html
- En la extensión usa **Ir a mi perfil** y **Previsualizar/Llenar**

Persistencia backend:
- La información se guarda en PostgreSQL en tablas: `users`, `user_profiles`, `user_knowledge`, `app_logs`.

## 5) Ejecutar con Docker
```bash
docker compose up --build
```

Servicios:
- PostgreSQL: localhost:5432
- API: http://localhost:3000
- Web: http://localhost:5173

La base queda persistida en el volumen `api_data` del `docker-compose.yml`.

Token demo: `demo-token`
