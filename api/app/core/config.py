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
    smtp_host: str = os.getenv('SMTP_HOST', 'localhost')
    smtp_port: int = int(os.getenv('SMTP_PORT', '1025'))
    smtp_username: str = os.getenv('SMTP_USERNAME', '')
    smtp_password: str = os.getenv('SMTP_PASSWORD', '')
    smtp_from_email: str = os.getenv('SMTP_FROM_EMAIL', 'no-reply@fillingforyou.local')
    smtp_use_tls: bool = os.getenv('SMTP_USE_TLS', 'false').lower() == 'true'
    password_reset_code_minutes: int = int(os.getenv('PASSWORD_RESET_CODE_MINUTES', '10'))
    password_reset_code_max_attempts: int = int(os.getenv('PASSWORD_RESET_CODE_MAX_ATTEMPTS', '5'))


settings = Settings()
