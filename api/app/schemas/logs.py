from pydantic import BaseModel, Field


class LogEvent(BaseModel):
    url: str
    action: str
    field: dict = Field(default_factory=dict)
    meta: dict = Field(default_factory=dict)
    ts: str | None = None
