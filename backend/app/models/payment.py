from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Request Models
class PaymentPlanRequest(BaseModel):
    plan_name: str  # STARTER, POPULAR, or PREMIUM

class CreateOrderRequest(BaseModel):
    plan_name: str

class VerifyPaymentRequest(BaseModel):
    payment_id: str
    order_id: str
    signature: str
    plan_name: str

# Response Models
class PaymentResponse(BaseModel):
    order_id: str
    amount: int
    currency: str = "INR"
    key_id: str
    plan_name: str
    credits: int

class BuyResumeSlotResponse(BaseModel):
    message: str
    credits_remaining: int
    max_resume: int

class PaymentRecordResponse(BaseModel):
    id: str
    user_id: str
    plan_name: str
    credits_added: int
    amount_paid: int
    payment_id: str
    order_id: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaymentHistoryResponse(BaseModel):
    payments: List[PaymentRecordResponse]
    total: int
