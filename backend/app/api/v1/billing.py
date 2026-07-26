import os
import stripe
from fastapi import APIRouter, HTTPException, status, Depends, Request, Header
from app.config import get_settings
from app.api.v1.middleware import get_current_user
from app.api.v1.auth import load_users, save_users

router = APIRouter(prefix="/billing", tags=["billing"])

# Settings will be loaded per request where needed or at module level
settings = get_settings()
stripe.api_key = settings.stripe_secret_key
STRIPE_WEBHOOK_SECRET = settings.stripe_webhook_secret
FRONTEND_URL = settings.frontend_url

@router.post("/checkout-session")
async def create_checkout_session(current_user: dict = Depends(get_current_user)):
    """Create a Stripe checkout session to upgrade to Pro."""
    try:
        # In a real implementation, you'd lookup or create a Stripe customer here
        # and use a real Price ID from your Stripe dashboard
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'Foresight Pro',
                        'description': 'Unlimited scenarios, Goal Seeker, Battle Mode, and more.',
                    },
                    'unit_amount': 1500, # $15.00
                    'recurring': {'interval': 'month'}
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{FRONTEND_URL}?checkout=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}?checkout=cancel",
            client_reference_id=current_user["email"],
            customer_email=current_user["email"]
        )
        return {"url": session.url}
    except Exception as e:
        # Fallback for dev mode when Stripe keys aren't set
        print(f"Stripe error: {e}. Returning mock URL for dev.")
        # Actually upgrade the user in our DB so the mock works
        users = load_users()
        email = current_user["email"]
        if email in users:
            users[email]['tier'] = 'pro'
            users[email]['stripe_customer_id'] = f"mock_cus_{email}"
            save_users(users)
            print(f"Mock upgraded user {email} to PRO")
            
        return {"url": f"{FRONTEND_URL}?checkout=success&mock=true"}

@router.post("/verify-session")
async def verify_checkout_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Verify a checkout session and upgrade user immediately if paid."""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == 'paid':
            users = load_users()
            email = current_user["email"]
            if email in users and users[email].get('tier') != 'pro':
                users[email]['tier'] = 'pro'
                users[email]['stripe_customer_id'] = session.customer
                save_users(users)
                print(f"Upgraded user {email} to PRO via session verification")
            return {"status": "success", "tier": "pro"}
        return {"status": "pending", "tier": "free"}
    except Exception as e:
        print(f"Session verification error: {e}")
        raise HTTPException(status_code=400, detail="Invalid session")

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhooks for subscription updates."""
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        # For local development without a real webhook, we'll just parse the JSON directly
        # DO NOT DO THIS IN PRODUCTION
        import json
        try:
            event = json.loads(payload)
        except:
            raise HTTPException(status_code=400, detail="Invalid payload")

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        email = session.get('client_reference_id') or session.get('customer_email')
        customer_id = session.get('customer')
        
        if email:
            users = load_users()
            if email in users:
                users[email]['tier'] = 'pro'
                users[email]['stripe_customer_id'] = customer_id
                save_users(users)
                print(f"Upgraded user {email} to PRO via Stripe webhook")

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        customer_id = subscription.get('customer')
        
        # Find user by customer_id and downgrade
        users = load_users()
        for email, user in users.items():
            if user.get('stripe_customer_id') == customer_id:
                user['tier'] = 'free'
                save_users(users)
                print(f"Downgraded user {email} to FREE via Stripe webhook")
                break

    return {"status": "success"}
