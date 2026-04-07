import os

from pydantic import BaseModel


class Settings(BaseModel):
    demo_token: str = os.getenv('DEMO_TOKEN', 'demo-token')
    database_url: str = os.getenv(
        'DATABASE_URL',
        'postgresql+psycopg://autofill:${DB_PASSWORD}@localhost:5432/autofill',
    )
    bootstrap_user_email: str = os.getenv('BOOTSTRAP_USER_EMAIL', 'demo@fillingforyou.local')
    allowed_origins: list = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
    allowed_origin_regex: str = os.getenv(
        'ALLOWED_ORIGIN_REGEX',
        r'^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^chrome-extension://[a-z]+$|^edge-extension://[a-z]+$',
    )


settings = Settings()
