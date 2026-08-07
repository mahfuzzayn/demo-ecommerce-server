# Order Module

## Overview
The Order module handles customer orders from creation through fulfillment. It validates product availability, manages stock decrement, tracks order status lifecycle, supports coupons, carries the full payment context (provider, gateway session keys, transaction ids, FX conversion metadata) so the payment module can reconcile callbacks, and supports **guest checkout** (an order can be created without an account).

## How It Works
- **List orders** – Admin-only. Returns all orders with user and product details populated. Supports search, filter, sort, and pagination via QueryBuilder.
- **My orders** – Customer-only. Returns the authenticated customer's own orders (same search/filter/sort/pagination).
- **Track order** – Public. Looks up an order by its human-friendly `orderId` (or Mongo `_id`) and returns delivery + payment tracking insights.
- **Get order details** – Authenticated users (admin or the order owner). Returns full order with user and product population. Guest orders have no owner — only admins can view them here.
- **Get invoice** – Admin or the order owner. Returns invoice data (JSON) for the frontend to render. **Only for paid orders** — unpaid orders get 400.
- **Create order** – **No auth required (guest checkout)**; if a valid Bearer token is present the order is linked to that user, otherwise `user` is `null`. Validates each product exists, is active, and has sufficient stock. Computes all money server-side from DB prices (client-supplied `unitPrice`/totals are ignored). Verifies the coupon, decrements stock, and stores the currency inherited from the products.
- **Update order** – Admin or the order owner. Re-validates + re-prices the product list (restores old stock, decrements new quantities in a transaction), re-verifies the coupon, and recomputes `finalAmount`. Locked once `Completed`/`Cancelled`.
- **Change order status** – Admin-only. Updates the order's status through its lifecycle. Cannot change status of `Cancelled` or `Completed` orders.

### Status Lifecycle
Orders move through: `Pending` → `Processing` → `Shipped` → `Completed`. Can also be `Cancelled`. Once `Cancelled` or `Completed`, the status is locked.

### Order ID format
Every order gets a unique human-friendly `orderId`: `DE{DD}D{MM}M{0001}{U|G}` (e.g. `DE07D08M0001U`). `U` = placed by a logged-in user, `G` = guest. The 4-digit sequence increments per day and a unique index guarantees uniqueness.

### Currency & Payment Tracking
- **Currency** – inherited from the products at creation. All products in an order must share the same currency, else 400. Values: `usd` (default), `bdt`, `eur`, `gbp`, `inr`, `aed`, `aud`, `cad`.
- **FX reconciliation** – when a payment is charged in a different currency than the order (e.g. a BDT order paid via Stripe), `fxRate` and `fxBaseCurrency` are stored on the order.
- **Gateway tracking fields** – raw, unprefixed gateway values: `stripeSessionId`, `sslSessionKey`, `transactionId`. The provider that set them is identified by `paymentProvider` (`stripe` / `sslcommerz` / `bkash`).

## Test Data

### GET /api/v1/order (Get All Orders)
**Request:**
```
GET /api/v1/order?status=Pending&page=1&limit=10
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
    "success": true,
    "message": "Orders retrieved successfully",
    "meta": { "page": 1, "limit": 10, "total": 3, "totalPage": 1 },
    "data": [
        {
            "_id": "order_id",
            "orderId": "DE07D08M0001U",
            "user": { "_id": "user_id", "name": "John Doe", "email": "john@example.com" },
            "products": [
                {
                    "product": { "_id": "prod_id", "name": "Smartphone X", "price": 799.99 },
                    "quantity": 2,
                    "unitPrice": 799.99
                }
            ],
            "coupon": null,
            "totalAmount": 1599.98,
            "discount": 0,
            "deliveryCharge": 50,
            "finalAmount": 1649.98,
            "currency": "usd",
            "status": "Pending",
            "shippingAddress": "123 Main Street, Dhaka",
            "recipientName": "John Doe",
            "phoneNo": "+1 (555) 123-4567",
            "notes": "",
            "paymentMethod": "COD",
            "paymentStatus": "Pending",
            "paymentProvider": null,
            "fxRate": null,
            "fxBaseCurrency": null,
            "createdAt": "2025-01-01T00:00:00.000Z",
            "updatedAt": "2025-01-01T00:00:00.000Z"
        }
    ]
}
```

### GET /api/v1/order/my-orders (My Orders)
**Request:**
```
GET /api/v1/order/my-orders?status=Pending&page=1&limit=10
Authorization: Bearer <customer_token>
```

**Response:**
```json
{
    "success": true,
    "message": "My orders retrieved successfully",
    "meta": { "page": 1, "limit": 10, "total": 2, "totalPage": 1 },
    "data": [ { "...": "same structure as list item above" } ]
}
```

### GET /api/v1/order/track-order/:orderId (Track Order — Public)
**Request:**
```
GET /api/v1/order/track-order/DE07D08M0001U
```

**Response:**
```json
{
    "success": true,
    "message": "Order tracking details retrieved successfully",
    "data": {
        "orderId": "DE07D08M0001U",
        "id": "order_id",
        "status": "Processing",
        "paymentStatus": "Paid",
        "paymentMethod": "Online",
        "paymentProvider": "stripe",
        "currency": "usd",
        "totalAmount": 1599.98,
        "discount": 0,
        "deliveryCharge": 50,
        "finalAmount": 1649.98,
        "recipientName": "John Doe",
        "phoneNo": "+1 (555) 123-4567",
        "shippingAddress": "123 Main Street, Dhaka",
        "notes": "Please leave at the front desk",
        "placedBy": "John Doe",
        "products": [
            {
                "productId": "prod_id",
                "name": "Smartphone X",
                "image": "https://res.cloudinary.com/.../image1.jpg",
                "quantity": 2,
                "unitPrice": 799.99,
                "total": 1599.98
            }
        ],
        "statusHistory": [
            { "status": "Pending", "at": "2025-01-01T00:00:00.000Z" },
            { "status": "Processing", "at": "2025-01-02T00:00:00.000Z" }
        ],
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-02T00:00:00.000Z"
    }
}
```
Note: Public route — no auth. Useful for a "track your order" page where the customer enters their order id.

### GET /api/v1/order/:orderId/invoice (Get Order Invoice)
**Request:**
```
GET /api/v1/order/DE07D08M0001U/invoice
Authorization: Bearer <admin_token or customer_token>
```

**Response:**
```json
{
    "success": true,
    "message": "Order invoice retrieved successfully",
    "data": {
        "orderId": "DE07D08M0001U",
        "id": "order_id",
        "status": "Processing",
        "currency": "usd",
        "issuedAt": "2025-01-02T00:00:00.000Z",
        "customer": {
            "name": "John Doe",
            "email": "john@example.com",
            "phoneNo": "+1 (555) 123-4567",
            "address": "123 Main Street, Dhaka"
        },
        "recipient": {
            "name": "John Doe",
            "phoneNo": "+1 (555) 123-4567",
            "shippingAddress": "123 Main Street, Dhaka",
            "notes": ""
        },
        "payment": {
            "method": "Online",
            "provider": "stripe",
            "transactionId": "cs_test_abc123..."
        },
        "items": [
            {
                "productId": "prod_id",
                "name": "Smartphone X",
                "image": "https://res.cloudinary.com/.../image1.jpg",
                "quantity": 2,
                "unitPrice": 799.99,
                "total": 1599.98
            }
        ],
        "totals": {
            "subtotal": 1599.98,
            "discount": 0,
            "deliveryCharge": 50,
            "finalAmount": 1649.98
        }
    }
}
```
Note: Admin or the order owner. **400 unless `paymentStatus` is `Paid`** — the invoice is only generated for paid orders. The frontend uses this JSON with react-pdf to render + download the invoice.

### GET /api/v1/order/:orderId (Get Order Details)
**Request:**
```
GET /api/v1/order/order_id
Authorization: Bearer <admin_token or customer_token>
```

**Response:**
```json
{
    "success": true,
    "message": "Order details retrieved successfully",
    "data": { "...": "same structure as above" }
}
```
Only an admin or the user who placed the order can access it; anyone else gets `401 You are not authorized!`.

### POST /api/v1/order (Create Order — Guest or Authenticated)
**Request:**
```
POST /api/v1/order
// Authorization: Bearer <admin_token or customer_token>  ← OPTIONAL (guest checkout)
Content-Type: application/json

{
    "products": [
        { "product": "prod_id", "quantity": 2 }
    ],
    "coupon": "SAVE20",
    "deliveryCharge": 50,
    "shippingAddress": "123 Main Street, Dhaka",
    "recipientName": "John Doe",
    "phoneNo": "+1 (555) 123-4567",
    "notes": "Please call before delivery",
    "paymentMethod": "Online"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Order created successfully",
    "data": {
        "_id": "order_id",
        "orderId": "DE07D08M0002U",
        "user": { "_id": "user_id", "name": "John Doe", "email": "john@example.com" },
        "products": [
            {
                "product": { "_id": "prod_id", "name": "Smartphone X" },
                "quantity": 2,
                "unitPrice": 799.99
            }
        ],
        "totalAmount": 1599.98,
        "discount": 0,
        "deliveryCharge": 50,
        "finalAmount": 1649.98,
        "currency": "usd",
        "status": "Pending",
        "shippingAddress": "123 Main Street, Dhaka",
        "recipientName": "John Doe",
        "phoneNo": "+1 (555) 123-4567",
        "notes": "Please call before delivery",
        "paymentMethod": "Online",
        "paymentStatus": "Pending",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```
Note: `totalAmount`/`discount`/`finalAmount`/`unitPrice` are computed server-side from real product prices — never client-supplied. `coupon` is verified (exists, active, in date range, meets min order). Stock is decremented inside a transaction. `currency` is inherited from the products. With no token the order is created as a **guest** (`user: null`, orderId suffix `G`); with a valid token the order is linked to that user (suffix `U`). `recipientName` and `phoneNo` are required; `notes` is optional.

### PATCH /api/v1/order/:orderId (Update Order)
**Request:**
```
PATCH /api/v1/order/order_id
Authorization: Bearer <admin_token or customer_token>
Content-Type: application/json

{
    "products": [ { "product": "prod_id", "quantity": 3 } ],
    "coupon": "SAVE20",
    "deliveryCharge": 60,
    "shippingAddress": "456 New Street, Dhaka",
    "recipientName": "Jane Doe",
    "phoneNo": "+1 (555) 987-6543",
    "notes": "Updated note"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Order updated successfully",
    "data": { "...": "updated order with recomputed totals" }
}
```
Note: Same strategy as create — re-validates products + re-prices, restores old stock then decrements new quantities in a transaction, re-verifies coupon, recomputes `finalAmount` and `currency`. Locked once `Completed`/`Cancelled`. Guest orders can only be updated by an admin.

### PATCH /api/v1/order/:orderId/status (Update Order Status)
**Request:**
```
PATCH /api/v1/order/order_id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "status": "Processing"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Order status updated to Processing",
    "data": {
        "_id": "order_id",
        "status": "Processing",
        "...": "rest of order fields"
    }
}
```
