# Payment Module

## Overview
The Payment module handles payment processing through three providers: **Stripe** (international), **SSLCommerz** (Bangladesh), and **bKash** (Bangladesh mobile banking). It provides separate initiate and validate endpoints for each provider.

## How It Works
1. **Initiate** – An API call is made with the order ID and required payment details. The module communicates with the respective provider's API and returns a payment gateway URL, session ID, or payment intent for the frontend to redirect the user.
2. **Validate** – After the user completes (or fails) the payment on the provider's gateway, the validation endpoint confirms the transaction status. On success, the order's `paymentStatus` is updated to `Paid` and the order `status` is updated to `Processing`.

### Provider Details

**Stripe** – Uses PaymentIntents API. Init returns a `client_secret` and `paymentIntentId`. Validate retrieves the PaymentIntent to check the status.

**SSLCommerz** – Uses the `sslcommerz-lts` package. Init generates a gateway URL using customer/shipping info. Validate uses `val_id` from the callback response.

**bKash** – Uses the tokenized checkout API. Init obtains an access token then creates a checkout session. Validate executes the payment using the `paymentID`.

## Test Data

### POST /api/v1/payment/:orderId/stripe/init (Initiate Stripe)
**Request:**
```
POST /api/v1/payment/order_id_123/stripe/init
Authorization: Bearer <token>
Content-Type: application/json

{
    "amount": 1500,
    "currency": "usd"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Stripe payment initiated successfully",
    "data": {
        "success": true,
        "paymentIntentId": "pi_3Rabc123...",
        "clientSecret": "pi_3Rabc123_secret_xyz...",
        "message": "Stripe payment initiated successfully"
    }
}
```

### POST /api/v1/payment/stripe/validate (Validate Stripe)
**Request:**
```
POST /api/v1/payment/stripe/validate
Authorization: Bearer <token>
Content-Type: application/json

{
    "paymentIntentId": "pi_3Rabc123..."
}
```

**Response:**
```json
{
    "success": true,
    "message": "Payment validated successfully",
    "data": {
        "success": true,
        "transactionId": "pi_3Rabc123...",
        "status": "success",
        "message": "Payment validated successfully"
    }
}
```

### POST /api/v1/payment/:orderId/sslcommerz/init (Initiate SSLCommerz)
**Request:**
```
POST /api/v1/payment/order_id_123/sslcommerz/init
Authorization: Bearer <token>
Content-Type: application/json

{
    "total_amount": 1500,
    "product_name": "E-commerce Order",
    "product_category": "General",
    "cus_name": "John Doe",
    "cus_email": "customer@example.com",
    "cus_phone": "01712345678",
    "cus_add1": "123 Main Street",
    "cus_city": "Dhaka",
    "cus_state": "Dhaka",
    "cus_postcode": "1200",
    "cus_country": "Bangladesh",
    "ship_name": "John Doe",
    "ship_add1": "123 Main Street",
    "ship_city": "Dhaka",
    "ship_state": "Dhaka",
    "ship_postcode": "1200",
    "ship_country": "Bangladesh"
}
```

**Response:**
```json
{
    "success": true,
    "message": "SSLCommerz payment initiated successfully",
    "data": {
        "success": true,
        "gatewayUrl": "https://sandbox.sslcommerz.com/gwprocess/v4/...",
        "sessionId": "session_key_xyz",
        "message": "SSLCommerz payment initiated successfully"
    }
}
```

### POST /api/v1/payment/sslcommerz/validate (Validate SSLCommerz)
**Request:**
```
POST /api/v1/payment/sslcommerz/validate
Authorization: Bearer <token>
Content-Type: application/json

{
    "val_id": "val_id_from_callback"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Payment validated successfully",
    "data": {
        "success": true,
        "transactionId": "ORDER-abc-1234567890",
        "status": "success",
        "message": "SSLCommerz payment validated successfully"
    }
}
```

### POST /api/v1/payment/:orderId/bkash/init (Initiate bKash)
**Request:**
```
POST /api/v1/payment/order_id_123/bkash/init
Authorization: Bearer <token>
Content-Type: application/json

{
    "amount": 1500,
    "customerNumber": "01712345678"
}
```

**Response:**
```json
{
    "success": true,
    "message": "bKash payment initiated successfully",
    "data": {
        "success": true,
        "gatewayUrl": "https://sandbox.bka.sh/...",
        "message": "bKash payment initiated successfully"
    }
}
```

### POST /api/v1/payment/bkash/validate (Validate bKash)
**Request:**
```
POST /api/v1/payment/bkash/validate
Authorization: Bearer <token>
Content-Type: application/json

{
    "paymentID": "bkash_payment_id_from_callback"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Payment validated successfully",
    "data": {
        "success": true,
        "transactionId": "TRX123456",
        "status": "success",
        "message": "bKash payment validated successfully"
    }
}
```
