from pydantic import BaseModel
from typing import Optional

class RegisterPayload(BaseModel):
    local_user_id: str
    local_profile_id: str
    phone_number: str
    password: str
    name: str
    language_code: str
    occupation_type: str
    education_level: str
    income_type: str
    income_value: str
    current_balance: float
    crop_type: Optional[str] = None
    land_holding: Optional[str] = None
    income_pattern: Optional[str] = None
    is_blind: bool = False

class LoginPayload(BaseModel):
    phone_number: str
    password: str

class TransactionSyncItem(BaseModel):
    transaction_id: str
    amount: float
    type: str
    reason: str
    created_at: str

class SyncPayload(BaseModel):
    user_id: str
    transactions: list[TransactionSyncItem]
