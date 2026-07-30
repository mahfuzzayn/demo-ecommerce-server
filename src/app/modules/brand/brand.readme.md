# Brand Module

## Overview
The Brand module manages product brands. Each brand has a name and optional logo image. Brands can be soft-deleted by setting `isActive: false`.

## How It Works
- **List brands** – Public route, returns active brands with pagination
- **Create brand** – Admin-only, validates name uniqueness (case-insensitive)
- **Update brand** – Admin-only, checks name uniqueness before updating
- **Delete brand** – Admin-only, performs a soft delete (sets `isActive: false`)
- Brands are linked to products via the brand field

## Test Data

### GET /api/v1/brand (Get All Brands)
**Request:**
```
GET /api/v1/brand?searchTerm=nike&page=1&limit=10
```

**Response:**
```json
{
    "success": true,
    "message": "Brands retrieved successfully",
    "meta": { "page": 1, "limit": 10, "total": 2, "totalPage": 1 },
    "data": [
        {
            "_id": "brand_id_1",
            "name": "Nike",
            "logo": "https://example.com/nike.png",
            "isActive": true,
            "createdBy": { "_id": "user_id", "name": "Admin", "email": "admin@example.com" },
            "createdAt": "2025-01-01T00:00:00.000Z",
            "updatedAt": "2025-01-01T00:00:00.000Z"
        }
    ]
}
```

### POST /api/v1/brand (Create Brand)
**Request:**
```
POST /api/v1/brand
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "name": "Nike",
    "logo": "https://example.com/nike.png"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Brand created successfully",
    "data": {
        "_id": "brand_id_1",
        "name": "Nike",
        "logo": "https://example.com/nike.png",
        "isActive": true,
        "createdBy": "user_id",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```

### PATCH /api/v1/brand/:id (Update Brand)
**Request:**
```
PATCH /api/v1/brand/brand_id_1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "name": "Nike Updated"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Brand updated successfully",
    "data": {
        "_id": "brand_id_1",
        "name": "Nike Updated",
        "logo": "https://example.com/nike.png",
        "isActive": true,
        "createdBy": "user_id",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```

### DELETE /api/v1/brand/:id (Delete Brand)
**Request:**
```
DELETE /api/v1/brand/brand_id_1
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
    "success": true,
    "message": "Brand deleted successfully",
    "data": {
        "_id": "brand_id_1",
        "name": "Nike Updated",
        "logo": "https://example.com/nike.png",
        "isActive": false,
        "createdBy": "user_id",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```
