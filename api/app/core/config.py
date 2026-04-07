import os

from pydantic import BaseModel


class Settings(BaseModel):
    database_url: str = os.getenv(
        'DATABASE_URL',
        'postgresql+psycopg://autofill:${DB_PASSWORD}@localhost:5432/autofill',
    )
    jwt_secret: str = os.getenv('JWT_SECRET', 'change-this-in-production')
    jwt_algorithm: str = os.getenv('JWT_ALGORITHM', 'HS256')
    jwt_exp_minutes: int = int(os.getenv('JWT_EXP_MINUTES', '60'))
    allowed_origins: list = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
    allowed_origin_regex: str = os.getenv(
        'ALLOWED_ORIGIN_REGEX',
        r'^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^chrome-extension://[a-z]+$|^edge-extension://[a-z]+$',
    )


settings = Settings()
