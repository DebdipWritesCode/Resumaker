from fastapi import APIRouter, Depends, HTTPException, status
from app.models.payment import (
    PaymentPlanRequest,
    CreateOrderRequest,
    VerifyPaymentRequest,
    PaymentResponse,
    BuyResumeSlotResponse,
    PaymentRecordResponse,
    PaymentHistoryResponse,
    BuyCoffeeOrderRequest,
    BuyCoffeeVerifyRequest,
    BuyCoffeeResponse
)
from app.middleware.auth_middleware import get_current_user
from app.services.payment_service import (
    create_payment_order,
    verify_payment,
    process_credit_purchase,
    buy_resume_slot,
    create_coffee_order,
    process_coffee_payment
)
from app.utils.constants import PAYMENT_PLANS
from app.database import get_payments_collection
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/payment", tags=["Payment"])

@router.post("/create-order", response_model=PaymentResponse)
async def create_order_endpoint(
    request: CreateOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Razorpay order for credit purchase"""
    # Validate plan name
    if request.plan_name not in PAYMENT_PLANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan name. Must be one of: {', '.join(PAYMENT_PLANS.keys())}"
        )
    
    plan = PAYMENT_PLANS[request.plan_name]
    amount = plan["price_inr"]
    
    try:
        order_data = await create_payment_order(amount, request.plan_name)
        return PaymentResponse(**order_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment order: {str(e)}"
        )

@router.post("/verify-payment", response_model=PaymentRecordResponse)
async def verify_payment_endpoint(
    request: VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment and add credits to user account"""
    user_id = current_user["user_id"]
    
    # Validate plan name
    if request.plan_name not in PAYMENT_PLANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan name. Must be one of: {', '.join(PAYMENT_PLANS.keys())}"
        )
    
    plan = PAYMENT_PLANS[request.plan_name]
    credits = plan["credits"]
    amount = plan["price_inr"]
    
    # Verify payment signature
    is_valid = verify_payment(request.payment_id, request.order_id, request.signature)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature. Payment verification failed."
        )
    
    # Check if payment already processed (prevent duplicate processing)
    payments_collection = get_payments_collection()
    existing_payment = await payments_collection.find_one({
        "payment_id": request.payment_id,
        "order_id": request.order_id
    })
    
    if existing_payment:
        # Payment already processed, return existing record
        return PaymentRecordResponse(
            id=str(existing_payment["_id"]),
            user_id=str(existing_payment["user_id"]),
            plan_name=existing_payment["plan_name"],
            credits_added=existing_payment["credits_added"],
            amount_paid=existing_payment["amount_paid"],
            payment_id=existing_payment["payment_id"],
            order_id=existing_payment["order_id"],
            status=existing_payment["status"],
            created_at=existing_payment["created_at"]
        )
    
    # Process credit purchase
    try:
        await process_credit_purchase(
            user_id,
            request.plan_name,
            credits,
            request.payment_id,
            request.order_id,
            amount
        )
        
        # Fetch the created payment record
        payment_record = await payments_collection.find_one({
            "payment_id": request.payment_id,
            "order_id": request.order_id
        })
        
        if not payment_record:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment processed but record not found"
            )
        
        return PaymentRecordResponse(
            id=str(payment_record["_id"]),
            user_id=str(payment_record["user_id"]),
            plan_name=payment_record["plan_name"],
            credits_added=payment_record["credits_added"],
            amount_paid=payment_record["amount_paid"],
            payment_id=payment_record["payment_id"],
            order_id=payment_record["order_id"],
            status=payment_record["status"],
            created_at=payment_record["created_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process payment: {str(e)}"
        )

@router.post("/buy-resume-slot", response_model=BuyResumeSlotResponse)
async def buy_resume_slot_endpoint(
    current_user: dict = Depends(get_current_user)
):
    """Purchase one resume slot using credits"""
    user_id = current_user["user_id"]
    
    try:
        result = await buy_resume_slot(user_id)
        return BuyResumeSlotResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to purchase resume slot: {str(e)}"
        )

@router.post("/buy-coffee/create-order", response_model=BuyCoffeeResponse)
async def create_coffee_order_endpoint(
    request: BuyCoffeeOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a Razorpay order for coffee donation"""
    # Validate amount (min ₹10, max ₹10,000)
    MIN_AMOUNT = 10
    MAX_AMOUNT = 10000
    
    if request.amount < MIN_AMOUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount must be at least ₹{MIN_AMOUNT}"
        )
    
    if request.amount > MAX_AMOUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount must not exceed ₹{MAX_AMOUNT}"
        )
    
    try:
        order_data = await create_coffee_order(request.amount)
        return BuyCoffeeResponse(**order_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment order: {str(e)}"
        )

@router.post("/buy-coffee/verify", response_model=PaymentRecordResponse)
async def verify_coffee_payment_endpoint(
    request: BuyCoffeeVerifyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment for coffee donation and save payment record"""
    user_id = current_user["user_id"]
    
    # Validate amount (min ₹10, max ₹10,000)
    MIN_AMOUNT = 10
    MAX_AMOUNT = 10000
    
    if request.amount < MIN_AMOUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount must be at least ₹{MIN_AMOUNT}"
        )
    
    if request.amount > MAX_AMOUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount must not exceed ₹{MAX_AMOUNT}"
        )
    
    # Verify payment signature
    is_valid = verify_payment(request.payment_id, request.order_id, request.signature)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature. Payment verification failed."
        )
    
    # Check if payment already processed (prevent duplicate processing)
    payments_collection = get_payments_collection()
    existing_payment = await payments_collection.find_one({
        "payment_id": request.payment_id,
        "order_id": request.order_id
    })
    
    if existing_payment:
        # Payment already processed, return existing record
        return PaymentRecordResponse(
            id=str(existing_payment["_id"]),
            user_id=str(existing_payment["user_id"]),
            plan_name=existing_payment["plan_name"],
            credits_added=existing_payment["credits_added"],
            amount_paid=existing_payment["amount_paid"],
            payment_id=existing_payment["payment_id"],
            order_id=existing_payment["order_id"],
            status=existing_payment["status"],
            created_at=existing_payment["created_at"]
        )
    
    # Process coffee payment (donation, no credits added)
    try:
        await process_coffee_payment(
            user_id,
            request.payment_id,
            request.order_id,
            request.amount
        )
        
        # Fetch the created payment record
        payment_record = await payments_collection.find_one({
            "payment_id": request.payment_id,
            "order_id": request.order_id
        })
        
        if not payment_record:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment processed but record not found"
            )
        
        return PaymentRecordResponse(
            id=str(payment_record["_id"]),
            user_id=str(payment_record["user_id"]),
            plan_name=payment_record["plan_name"],
            credits_added=payment_record["credits_added"],
            amount_paid=payment_record["amount_paid"],
            payment_id=payment_record["payment_id"],
            order_id=payment_record["order_id"],
            status=payment_record["status"],
            created_at=payment_record["created_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process payment: {str(e)}"
        )

@router.get("/history", response_model=PaymentHistoryResponse)
async def get_payment_history(
    current_user: dict = Depends(get_current_user)
):
    """Get payment history for the current user"""
    user_id = current_user["user_id"]
    user_object_id = ObjectId(user_id)
    
    try:
        payments_collection = get_payments_collection()
        
        # Fetch all payments for the user, sorted by created_at descending (most recent first)
        cursor = payments_collection.find({"user_id": user_object_id}).sort("created_at", -1)
        payments = await cursor.to_list(length=None)
        
        # Convert to response models
        payment_records = []
        for payment in payments:
            payment_records.append(
                PaymentRecordResponse(
                    id=str(payment["_id"]),
                    user_id=str(payment["user_id"]),
                    plan_name=payment["plan_name"],
                    credits_added=payment["credits_added"],
                    amount_paid=payment["amount_paid"],
                    payment_id=payment["payment_id"],
                    order_id=payment["order_id"],
                    status=payment["status"],
                    created_at=payment["created_at"]
                )
            )
        
        return PaymentHistoryResponse(
            payments=payment_records,
            total=len(payment_records)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch payment history: {str(e)}"
        )
