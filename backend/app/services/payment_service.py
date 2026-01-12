import razorpay
import hmac
import hashlib
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from app.settings.get_env import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
from app.database import get_payments_collection
from app.utils.constants import PAYMENT_PLANS, CREDIT_COSTS
from app.services.credit_service import add_credits, deduct_credits, increment_max_resume

# Initialize Razorpay client
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

async def create_payment_order(amount: int, plan_name: str) -> dict:
    """
    Create a Razorpay order for credit purchase.
    
    Args:
        amount: Amount in INR (in paise, so multiply by 100)
        plan_name: Name of the payment plan (STARTER, POPULAR, PREMIUM)
    
    Returns:
        Dictionary with order details including order_id, amount, key_id
    """
    if plan_name not in PAYMENT_PLANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan name. Must be one of: {', '.join(PAYMENT_PLANS.keys())}"
        )
    
    # Amount should be in paise (multiply by 100)
    amount_in_paise = amount * 100
    
    try:
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"credits_{plan_name}_{datetime.utcnow().timestamp()}",
            "notes": {
                "plan_name": plan_name,
                "credits": str(PAYMENT_PLANS[plan_name]["credits"])
            }
        }
        
        order = client.order.create(data=order_data)
        
        return {
            "order_id": order["id"],
            "amount": amount,
            "currency": "INR",
            "key_id": RAZORPAY_KEY_ID,
            "plan_name": plan_name,
            "credits": PAYMENT_PLANS[plan_name]["credits"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment order: {str(e)}"
        )

def verify_payment(payment_id: str, order_id: str, signature: str) -> bool:
    """
    Verify Razorpay payment signature.
    
    Args:
        payment_id: Razorpay payment ID
        order_id: Razorpay order ID
        signature: Payment signature from Razorpay
    
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Create the message to verify
        message = f"{order_id}|{payment_id}"
        
        # Generate expected signature
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures using constant-time comparison
        return hmac.compare_digest(generated_signature, signature)
    except Exception as e:
        return False

async def process_credit_purchase(user_id: str, plan_name: str, credits: int, payment_id: str, order_id: str, amount: int) -> None:
    """
    Process credit purchase after successful payment verification.
    Adds credits to user account and saves payment record.
    
    Args:
        user_id: User ID
        plan_name: Payment plan name
        credits: Number of credits to add
        payment_id: Razorpay payment ID
        order_id: Razorpay order ID
        amount: Amount paid in INR
    """
    # Add credits to user account
    await add_credits(user_id, credits)
    
    # Save payment record
    payments_collection = get_payments_collection()
    payment_doc = {
        "user_id": ObjectId(user_id),
        "plan_name": plan_name,
        "credits_added": credits,
        "amount_paid": amount,
        "payment_id": payment_id,
        "order_id": order_id,
        "status": "completed",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await payments_collection.insert_one(payment_doc)

async def create_coffee_order(amount: int) -> dict:
    """
    Create a Razorpay order for coffee donation.
    
    Args:
        amount: Amount in INR (will be converted to paise)
    
    Returns:
        Dictionary with order details including order_id, amount, key_id
    """
    # Validate amount (min ₹10, max ₹10,000)
    MIN_AMOUNT = 10
    MAX_AMOUNT = 10000
    
    if amount < MIN_AMOUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount must be at least ₹{MIN_AMOUNT}"
        )
    
    if amount > MAX_AMOUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount must not exceed ₹{MAX_AMOUNT}"
        )
    
    # Amount should be in paise (multiply by 100)
    amount_in_paise = amount * 100
    
    try:
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"coffee_{datetime.utcnow().timestamp()}",
            "notes": {
                "plan_name": "BUY_COFFEE",
                "type": "donation"
            }
        }
        
        order = client.order.create(data=order_data)
        
        return {
            "order_id": order["id"],
            "amount": amount,
            "currency": "INR",
            "key_id": RAZORPAY_KEY_ID,
            "plan_name": "BUY_COFFEE"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment order: {str(e)}"
        )

async def process_coffee_payment(user_id: str, payment_id: str, order_id: str, amount: int) -> None:
    """
    Process coffee donation payment after successful payment verification.
    Saves payment record without adding credits (donation only).
    
    Args:
        user_id: User ID
        payment_id: Razorpay payment ID
        order_id: Razorpay order ID
        amount: Amount paid in INR
    """
    # Save payment record (no credits added for donations)
    payments_collection = get_payments_collection()
    payment_doc = {
        "user_id": ObjectId(user_id),
        "plan_name": "BUY_COFFEE",
        "credits_added": 0,
        "amount_paid": amount,
        "payment_id": payment_id,
        "order_id": order_id,
        "status": "completed",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await payments_collection.insert_one(payment_doc)

async def buy_resume_slot(user_id: str) -> dict:
    """
    Purchase one resume slot using credits.
    Deducts 30 credits and increments max_resume by 1.
    
    Args:
        user_id: User ID
    
    Returns:
        Dictionary with success message, remaining credits, and new max_resume
    """
    from app.services.credit_service import get_user_credits, get_user_max_resume
    
    # Check and deduct credits
    await deduct_credits(user_id, CREDIT_COSTS.CUSTOM_RESUME_SLOT)
    
    # Increment max_resume
    await increment_max_resume(user_id)
    
    # Get updated values
    remaining_credits = await get_user_credits(user_id)
    new_max_resume = await get_user_max_resume(user_id)
    
    return {
        "message": "Resume slot purchased successfully",
        "credits_remaining": remaining_credits,
        "max_resume": new_max_resume
    }
