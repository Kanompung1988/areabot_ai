"""
Subscription & Billing endpoints (Stripe integration).
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/billing", tags=["Billing"])


def _get_stripe():
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(503, "Billing not configured")
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


@router.get("/plans")
def list_plans():
    """List available subscription plans."""
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price": 0,
                "currency": "THB",
                "features": ["1 Bot", "100 messages/month", "Text responses only"],
                "message_limit": 100,
                "bot_limit": 1,
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 590,
                "currency": "THB",
                "features": ["5 Bots", "5,000 messages/month", "Knowledge Base", "Rich Messages", "Export"],
                "message_limit": 5000,
                "bot_limit": 5,
            },
            {
                "id": "business",
                "name": "Business",
                "price": 1990,
                "currency": "THB",
                "features": ["Unlimited Bots", "50,000 messages/month", "All features", "Priority support", "Custom branding"],
                "message_limit": 50000,
                "bot_limit": -1,
            },
        ]
    }


@router.get("/subscription")
def get_subscription(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id
    ).first()
    if not sub:
        return {"plan": "free", "status": "active", "message_count": 0, "message_limit": 100}
    return {
        "plan": sub.plan,
        "status": sub.status,
        "message_count": sub.message_count,
        "message_limit": sub.message_limit,
        "stripe_customer_id": sub.stripe_customer_id,
        "current_period_end": str(sub.current_period_end) if sub.current_period_end else None,
    }


@router.post("/checkout")
async def create_checkout(
    body: schemas.CheckoutRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stripe = _get_stripe()

    price_map = {
        "pro": settings.STRIPE_PRICE_PRO,
        "business": settings.STRIPE_PRICE_BUSINESS,
    }
    price_id = price_map.get(body.plan)
    if not price_id:
        raise HTTPException(400, "Invalid plan")

    sub = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id
    ).first()

    customer_id = sub.stripe_customer_id if sub else None
    if not customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.full_name,
            metadata={"user_id": current_user.id},
        )
        customer_id = customer.id

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.FRONTEND_URL}/dashboard?billing=success",
        cancel_url=f"{settings.FRONTEND_URL}/dashboard?billing=cancel",
        metadata={"user_id": current_user.id, "plan": body.plan},
    )

    return {"checkout_url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events."""
    stripe = _get_stripe()
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        raise HTTPException(400, "Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        plan = session["metadata"]["plan"]

        limit_map = {"pro": 5000, "business": 50000}

        sub = db.query(models.Subscription).filter(
            models.Subscription.user_id == user_id
        ).first()
        if not sub:
            sub = models.Subscription(user_id=user_id)
            db.add(sub)

        sub.plan = plan
        sub.status = "active"
        sub.stripe_customer_id = session.get("customer")
        sub.stripe_subscription_id = session.get("subscription")
        sub.message_limit = limit_map.get(plan, 100)
        db.commit()

    elif event["type"] == "customer.subscription.deleted":
        sub_data = event["data"]["object"]
        sub = db.query(models.Subscription).filter(
            models.Subscription.stripe_subscription_id == sub_data["id"]
        ).first()
        if sub:
            sub.status = "cancelled"
            sub.plan = "free"
            sub.message_limit = 100
            db.commit()

    return {"status": "ok"}
