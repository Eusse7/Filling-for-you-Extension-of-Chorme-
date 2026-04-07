import unicodedata

from pydantic import BaseModel, field_validator


class Knowledge(BaseModel):
    about_me: str = 'Cuéntanos sobre ti: Soy un candidato con experiencia en ...'
    strengths: str = 'Fortalezas: aprendizaje rápido, comunicación clara, disciplina.'
    salary_expectation: str = 'Expectativa salarial: (ajustable según rol y modalidad).'
    cover_letter: str = 'Carta/introducción: Me interesa esta vacante porque ...'

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
