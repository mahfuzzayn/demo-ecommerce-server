# Coupon Module

## Overview
The Coupon module manages promotional coupon codes. Coupons can offer percentage-based or fixed-amount discounts with configurable minimum order amounts, maximum discount caps, and validity date ranges.

## How It Works
- **Create coupon** – Admin creates coupons with discount rules
- **List coupons** – Admin views all coupons with pagination
- **Get by code** – Public route to validate a coupon code; checks date range and active status
- **Update coupon** – Admin updates coupon details
- **Delete coupon** – Soft delete (isDeleted flag), coupons are excluded from queries by default
- Coupons auto-validate their date range upon creation

## Test Data

### POST /api/v1/coupon (Create Coupon)
**Request:**
```
POST /api/v1/coupon
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "code": "SAVE20",
    "discountType": "percentage",
    "discountValue": 20,
    "minOrderAmount": 500,
    "maxDiscountAmount": 200,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Coupon created successfully",
    "data": {
        "_id": "coupon_id",
        "code": "SAVE20",
        "discountType": "percentage",
        "discountValue": 20,
        "minOrderAmount": 500,
        "maxDiscountAmount": 200,
        "startDate": "2025-01-01T00:00:00.000Z",
        "endDate": "2025-12-31T00:00:00.000Z",
        "isActive": true,
        "isDeleted": false,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```

### GET /api/v1/coupon (Get All Coupons)
**Request:**
```
GET /api/v1/coupon
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
    "success": true,
    "message": "Coupons retrieved successfully",
    "meta": { "page": 1, "limit": 10, "total": 1, "totalPage": 1 },
    "data": [{ "_id": "coupon_id", "code": "SAVE20", ... }]
}
```

### GET /api/v1/coupon/:couponCode (Get Coupon By Code)
**Request:**
```
GET /api/v1/coupon/SAVE20
```

**Response:**
```json
{
    "success": true,
    "message": "Coupon retrieved successfully",
    "data": {
        "_id": "coupon_id",
        "code": "SAVE20",
        "discountType": "percentage",
        "discountValue": 20,
        "minOrderAmount": 500,
        "maxDiscountAmount": 200,
        "startDate": "2025-01-01T00:00:00.000Z",
        "endDate": "2025-12-31T00:00:00.000Z",
        "isActive": true,
        "isDeleted": false
    }
}
```

### PATCH /api/v1/coupon/:couponCode/update-coupon (Update Coupon)
**Request:**
```
PATCH /api/v1/coupon/SAVE20/update-coupon
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "discountValue": 25,
    "maxDiscountAmount": 250
}
```

**Response:**
```json
{
    "success": true,
    "message": "Coupon updated successfully",
    "data": { ... }
}
```

### DELETE /api/v1/coupon/:couponId (Delete Coupon)
**Request:**
```
DELETE /api/v1/coupon/coupon_id
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
    "success": true,
    "message": "Coupon deleted successfully",
    "data": {
        "_id": "coupon_id",
        "isDeleted": true,
        "isActive": false,
        ...
    }
}
```
