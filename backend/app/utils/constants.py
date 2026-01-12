"""
Constants for credits system and payment plans.
All credit costs and payment plan details are centralized here for easy modification.
"""

# Initial credits for new users
INITIAL_CREDITS = 10

# Initial max resume slots for new users
INITIAL_MAX_RESUMES = 2

# Credit costs for various actions
class CREDIT_COSTS:
    EXTRACT_RESUME = 5
    REPHRASE = 2
    SELECT_RESUME_ELEMENTS = 5
    CUSTOM_RESUME_SLOT = 30

# Payment plans configuration
# Format: plan_name -> {"credits": amount, "price_inr": amount, "display_name": "Name"}
PAYMENT_PLANS = {
    "STARTER": {
        "credits": 70,
        "price_inr": 60,
        "display_name": "Starter Plan"
    },
    "POPULAR": {
        "credits": 400,
        "price_inr": 250,
        "display_name": "Popular Plan"
    },
    "PREMIUM": {
        "credits": 1000,
        "price_inr": 500,
        "display_name": "Premium Plan"
    }
}
