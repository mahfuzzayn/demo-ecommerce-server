# Product Module

## Overview
The Product module manages the entire product catalog. Products support rich metadata including multiple images (Cloudinary), specifications, key features, available colors, and pricing. Products can be soft-deleted and have their stock tracked.

## How It Works
- **List products** – Public route. Returns active products with category and brand populated. Supports search, filter, sort, pagination, and price range filtering via QueryBuilder.
- **Get single product** – Public route. Returns product details with category and brand populated.
- **Create product** – Admin-only. Accepts up to 10 images via Multer/Cloudinary (`images` field). Auto-generates slug from name. Category and brand are validated as existing ObjectId references.
- **Update product** – Admin-only. Replaces image array, re-validates slug uniqueness and category/brand references.
- **Delete product** – Admin-only. Soft-deletes by setting `isActive: false`.

## Test Data

### GET /api/v1/product (Get All Products)
**Request:**
```
GET /api/v1/product?searchTerm=phone&minPrice=100&maxPrice=1000&page=1&limit=10
```

**Response:**
```json
{
    "success": true,
    "message": "Products retrieved successfully",
    "meta": { "page": 1, "limit": 10, "total": 5, "totalPage": 1 },
    "data": [
        {
            "_id": "prod_id",
            "name": "Smartphone X",
            "slug": "smartphone-x",
            "description": "Latest smartphone with advanced features",
            "price": 799.99,
            "stock": 50,
            "weight": 0.2,
            "category": { "_id": "cat_id", "name": "Electronics", "slug": "electronics" },
            "brand": { "_id": "brand_id", "name": "TechBrand", "logo": "https://..." },
            "imageUrls": ["https://res.cloudinary.com/.../image1.jpg"],
            "isActive": true,
            "averageRating": 4.5,
            "ratingCount": 12,
            "availableColors": ["Black", "White"],
            "specification": [
                { "key": "RAM", "value": "8GB" },
                { "key": "Storage", "value": "128GB" }
            ],
            "keyFeatures": ["5G Support", "Wireless Charging"],
            "createdAt": "2025-01-01T00:00:00.000Z",
            "updatedAt": "2025-01-01T00:00:00.000Z"
        }
    ]
}
```

### GET /api/v1/product/:productId (Get Single Product)
**Request:**
```
GET /api/v1/product/prod_id
```

**Response:**
```json
{
    "success": true,
    "message": "Product retrieved successfully",
    "data": { "...": "same structure as above" }
}
```

### POST /api/v1/product (Create Product)
**Request:**
```
POST /api/v1/product
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: { "name": "Smartphone X", "description": "...", "price": 799.99, "stock": 50, "weight": 0.2, "category": "cat_id", "brand": "brand_id", "specification": [{"key":"RAM","value":"8GB"}], "keyFeatures": ["5G"], "availableColors": ["Black","White"] }
  images: [file1, file2, ...] (max 10)
```

**Response:**
```json
{
    "success": true,
    "message": "Product created successfully",
    "data": { "...": "product object with populated category/brand" }
}
```

### PATCH /api/v1/product/:productId (Update Product)
**Request:**
```
PATCH /api/v1/product/prod_id
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: { "name": "Smartphone X Pro", "price": 899.99 }
  images: [new images]
```

**Response:**
```json
{
    "success": true,
    "message": "Product updated successfully",
    "data": { "...": "updated product" }
}
```

### DELETE /api/v1/product/:productId (Delete Product)
**Request:**
```
DELETE /api/v1/product/prod_id
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
    "success": true,
    "message": "Product deleted successfully",
    "data": {
        "_id": "prod_id",
        "isActive": false,
        "...": "rest of product fields"
    }
}
```
