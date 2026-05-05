from __future__ import annotations

import smtplib
from email.message import EmailMessage

from .config import settings


def send_password_reset_code(email: str, code: str) -> None:
    message = EmailMessage()
    message['Subject'] = 'Tu código para restablecer la contraseña'
    message['From'] = settings.smtp_from_email
    message['To'] = email
    message.set_content(
        '\n'.join([
            'Hola,',
            '',
            f'Tu código para restablecer la contraseña es: {code}',
            '',
            f'Este código expira en {settings.password_reset_code_minutes} minutos.',
            '',
            'Si no solicitaste este cambio, puedes ignorar este correo.',
        ])
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        smtp.ehlo()
        if settings.smtp_use_tls:
            smtp.starttls()
            smtp.ehlo()
        if settings.smtp_username:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)