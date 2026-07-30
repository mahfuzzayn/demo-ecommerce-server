# Order Module

## Overview
The Order module handles customer orders from creation through fulfillment. It validates product availability, manages stock decrement, tracks order status lifecycle, and supports multiple payment methods and payment statuses.

## How It Works
- **List orders** – Admin-only. Returns all orders with user and product details populated. Supports search by status/payment method, filter, sort, and pagination via QueryBuilder.
- **Get order details** – Authenticated users (admin or the order owner). Returns full order with user and product population.
- **Create order** – Authenticated users (admin or customer). Validates each product exists, is active, and has sufficient stock. Attaches the authenticated user as the order owner. Decrements stock for each product after creation.
- **Change order status** – Admin-only. Updates the order's status through its lifecycle. Cannot change status of `Cancelled` or `Completed` orders.

### Status Lifecycle
Orders move through: `Pending` → `Processing` → `Shipped` → `Completed`. Can also be `Cancelled`. Once `Cancelled` or `Completed`, the status is locked.

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
            "status": "Pending",
            "shippingAddress": "123 Main Street, Dhaka",
            "paymentMethod": "COD",
            "paymentStatus": "Pending",
            "createdAt": "2025-01-01T00:00:00.000Z",
            "updatedAt": "2025-01-01T00:00:00.000Z"
        }
    ]
}
```

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

### POST /api/v1/order (Create Order)
**Request:**
```
POST /api/v1/order
Authorization: Bearer <admin_token or customer_token>
Content-Type: application/json

{
    "products": [
        { "product": "prod_id", "quantity": 2, "unitPrice": 799.99 }
    ],
    "coupon": "SAVE20",
    "totalAmount": 1599.98,
    "discount": 0,
    "deliveryCharge": 50,
    "finalAmount": 1649.98,
    "shippingAddress": "123 Main Street, Dhaka",
    "paymentMethod": "COD"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Order created successfully",
    "data": {
        "_id": "order_id",
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
        "status": "Pending",
        "shippingAddress": "123 Main Street, Dhaka",
        "paymentMethod": "COD",
        "paymentStatus": "Pending",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```

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
