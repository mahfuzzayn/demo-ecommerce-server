# Review Module

## Overview
The Review module handles product reviews and ratings. Users can submit reviews with a rating (1-5) and description. Each user can only submit one review per product. When a review is created, the product's average rating and rating count are automatically updated.

## How It Works
- **List reviews** – Public route, returns all reviews with user and product details
- **Get single review** – Public route, returns a specific review
- **Create review** – Authenticated users can create reviews; duplicate user+product combinations are rejected
- **Rating sync** – Creating a review triggers an aggregation to recalculate the product's `averageRating` and `ratingCount`
- **Verified purchase** – Placeholder for future order verification integration

## Test Data

### GET /api/v1/review (Get All Reviews)
**Request:**
```
GET /api/v1/review?page=1&limit=10
```

**Response:**
```json
{
    "success": true,
    "message": "Reviews retrieved successfully",
    "meta": { "page": 1, "limit": 10, "total": 3, "totalPage": 1 },
    "data": [
        {
            "_id": "review_id_1",
            "rating": 4,
            "description": "Great product! Highly recommended.",
            "user": { "_id": "user_id", "name": "John Doe", "email": "john@example.com", "photoUrl": "" },
            "product": { "_id": "product_id", "name": "Smartphone X", "slug": "smartphone-x" },
            "isFlagged": false,
            "flaggedReason": "",
            "isVerifiedPurchase": false,
            "createdAt": "2025-01-15T00:00:00.000Z",
            "updatedAt": "2025-01-15T00:00:00.000Z"
        }
    ]
}
```

### GET /api/v1/review/:reviewId (Get Single Review)
**Request:**
```
GET /api/v1/review/review_id_1
```

**Response:**
```json
{
    "success": true,
    "message": "Review retrieved successfully",
    "data": {
        "_id": "review_id_1",
        "rating": 4,
        "description": "Great product! Highly recommended.",
        "user": { "_id": "user_id", "name": "John Doe", "email": "john@example.com", "photoUrl": "" },
        "product": { "_id": "product_id", "name": "Smartphone X", "slug": "smartphone-x" },
        "isFlagged": false,
        "flaggedReason": "",
        "isVerifiedPurchase": false,
        "createdAt": "2025-01-15T00:00:00.000Z",
        "updatedAt": "2025-01-15T00:00:00.000Z"
    }
}
```

### POST /api/v1/review (Create Review)
**Request:**
```
POST /api/v1/review
Authorization: Bearer <user_token>
Content-Type: application/json

{
    "rating": 4,
    "description": "Great product! Highly recommended.",
    "product": "product_id"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Review created successfully",
    "data": {
        "_id": "review_id_1",
        "rating": 4,
        "description": "Great product! Highly recommended.",
        "user": { "_id": "user_id", "name": "John Doe", "email": "john@example.com", "photoUrl": "" },
        "product": { "_id": "product_id", "name": "Smartphone X", "slug": "smartphone-x" },
        "isFlagged": false,
        "flaggedReason": "",
        "isVerifiedPurchase": false,
        "createdAt": "2025-01-15T00:00:00.000Z",
        "updatedAt": "2025-01-15T00:00:00.000Z"
    }
}
```
