from pydantic import BaseModel
from datetime import datetime

class AutofillHistoryCreate(BaseModel):
    url: str
    title: str

class AutofillHistoryResponse(BaseModel):
    id: int
    url: str
    title: str
    filled_at: datetime

