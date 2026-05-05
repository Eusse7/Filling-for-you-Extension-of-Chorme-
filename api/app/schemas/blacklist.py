from pydantic import BaseModel
from datetime import datetime

class BlacklistCreate(BaseModel):
    domain: str

class BlacklistResponse(BaseModel):
    id: int
    domain: str
    created_at: datetime
