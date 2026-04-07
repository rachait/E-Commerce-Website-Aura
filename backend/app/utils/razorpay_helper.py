import razorpay
from config import settings

def init_razorpay():
    """Initialize Razorpay client"""
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )

def create_razorpay_order(amount: float, order_id: str):
    """Create Razorpay order"""
    client = init_razorpay()
    
    # Amount in paise (smallest currency unit)
    amount_paise = int(amount * 100)
    
    order_data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": order_id,
        "payment_capture": 1
    }
    
    response = client.order.create(data=order_data)
    return response

def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str):
    """Verify Razorpay payment signature"""
    client = init_razorpay()
    
    params_dict = {
        'razorpay_order_id': razorpay_order_id,
        'razorpay_payment_id': razorpay_payment_id,
        'razorpay_signature': razorpay_signature
    }
    
    try:
        return client.utility.verify_payment_signature(params_dict)
    except Exception as e:
        return False
