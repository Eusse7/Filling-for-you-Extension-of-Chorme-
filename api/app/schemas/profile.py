import unicodedata

from pydantic import BaseModel, field_validator


class Profile(BaseModel):
    firstName: str = 'Juan'
    lastName: str = 'Pérez'
    email: str = 'juan.perez@email.com'
    phone: str = '+57 3000000000'
    addressLine1: str = 'Calle 123 #45-67'
    city: str = 'Medellín'
    country: str = 'CO'
    linkedin: str = 'https://linkedin.com/in/juan'
    github: str = 'https://github.com/juan'

    @field_validator('*', mode='before')
    @classmethod
    def normalize_unicode_text(cls, value: object) -> object:
        resultado = value
        if isinstance(value, str):
            normalized = unicodedata.normalize('NFC', value)
            for ch in normalized:
                if unicodedata.category(ch).startswith('C') and ch not in '\n\r\t':
                    raise ValueError('El texto contiene caracteres de control no permitidos')

            resultado = normalized

        return resultado
