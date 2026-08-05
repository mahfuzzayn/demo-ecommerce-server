# Product Module

## Overview
The Product module manages the entire product catalog. Products support rich metadata including multiple images (Cloudinary), specifications, key features, available colors, pricing, and a currency. Products can be soft-deleted (`isDeleted`), have their stock tracked, and carry an `averageRating`/`ratingCount` synced from reviews.

## How It Works
- **List products** – Public route. Returns non-deleted (`isDeleted: false`) products with category, brand, and non-flagged reviews populated. Supports search, filter, sort, pagination, and price-range filtering via QueryBuilder.
- **Get single product** – Public route. Returns product details with category, brand, and non-flagged reviews populated. 404 if missing or soft-deleted.
- **Create product** – Admin-only. Accepts up to 10 images via Multer/Cloudinary (`images` field). Auto-generates a unique slug from name if none is provided. Category and brand are validated as existing references. `createdBy` is attached from the authenticated admin. `currency` defaults to `usd`.
- **Update product** – Admin-only. Replaces the image array, re-validates slug uniqueness and category/brand references. Can toggle `isActive` both ways.
- **Delete product** – Admin-only. Soft-deletes by setting `isDeleted: true` and `isActive: false` (not toggleable back via delete).

### Slug rules
- If a slug is **provided**, it is rejected (409) only if it belongs to a product with a **different name**. Products with the same name (different price/variant) may share the slug.
- If **omitted**, a slug is generated from the name (lowercased, hyphenated). If the base slug is taken by a different-named product, a unique random-suffixed slug is generated instead.
- A name with no letters/numbers → 400.

### Currency
Products carry a `currency` (`usd` default, `bdt`, `eur`, `gbp`, `inr`, `aed`, `aud`, `cad`). Orders inherit the currency of their products.

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
            "currency": "usd",
            "stock": 50,
            "weight": 0.2,
            "category": { "_id": "cat_id", "name": "Electronics", "slug": "electronics" },
            "brand": { "_id": "brand_id", "name": "TechBrand", "logo": "https://..." },
            "createdBy": "user_id",
            "reviews": [
                {
                    "_id": "review_id_1",
                    "rating": 4,
                    "description": "Great product! Highly recommended.",
                    "isFlagged": false,
                    "createdAt": "2025-01-15T00:00:00.000Z"
                }
            ],
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
Note: Only non-deleted products are returned. Only non-flagged reviews are populated. `createdBy` is attached on create (admin id).

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
Note: 404 if the product does not exist or has been soft-deleted (`isDeleted: true`).

### POST /api/v1/product (Create Product)
**Request:**
```
POST /api/v1/product
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: { "name": "Smartphone X", "slug": "smartphone-x" (optional), "description": "...", "price": 799.99, "currency": "usd" (optional, default "usd"), "stock": 50, "weight": 0.2, "category": "cat_id", "brand": "brand_id", "specification": [{"key":"RAM","value":"8GB"}], "keyFeatures": ["5G"], "availableColors": ["Black","White"] }
  images: [file1, file2, ...] (max 10)
```

**Response:**
```json
{
    "success": true,
    "message": "Product created successfully",
    "data": { "...": "product object with populated category/brand, createdBy, reviews" }
}
```
Note: `slug` optional. If omitted, auto-generated from `name` (base slug if free, else `-<random>` suffix). If provided, it must not belong to a different-named product. `createdBy` is attached automatically from the authenticated admin. `currency` supports `usd` (default), `bdt`, `eur`, `gbp`, `inr`, `aed`, `aud`, `cad`.

### PATCH /api/v1/product/:productId (Update Product)
**Request:**
```
PATCH /api/v1/product/prod_id
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: { "name": "Smartphone X Pro", "slug": "smartphone-x-pro", "price": 899.99, "isActive": true }
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
Note: `isActive` can be toggled `true`/`false` freely (an inactive product can be re-activated). `slug` optional — same uniqueness rules as create. Uploaded images replace the existing `imageUrls` array.

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
        "isDeleted": true,
        "...": "rest of product fields"
    }
}
```
Note: Soft delete — sets `isDeleted: true` and `isActive: false`. The product is excluded from public reads.
