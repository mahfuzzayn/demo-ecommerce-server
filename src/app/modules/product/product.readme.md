# Product Module

## Overview
The Product module manages the entire product catalog. Products support rich metadata including multiple images (Cloudinary, with order + deletable publicIds), specifications, key features, attribute definitions + color options, variants (size/color combos with own SKU/price/stock), offer pricing (flat or percentage sales), and a currency inherited from the store. Products can be soft-deleted (`isDeleted`), have their stock tracked, and carry an `averageRating`/`ratingCount` synced from reviews.

## How It Works
- **List products** – Public route. Returns non-deleted (`isDeleted: false`) products with category, brand, and non-flagged reviews populated. Supports search, filter, sort, pagination, and price-range filtering via QueryBuilder.
- **Get single product** – Public route. Returns product details with category, brand, and non-flagged reviews populated. 404 if missing or soft-deleted.
- **Create product** – Admin-only. Accepts up to 10 images via Multer/Cloudinary (`images` field). Auto-generates a unique slug from name if none is provided. Category and brand are validated as existing references. `createdBy` is attached from the authenticated admin. **`currency` is NOT accepted — it inherits from the store's brand settings** (`brand.currency`).
- **Update product** – Admin-only. Advanced image management (`keepImages` + `newImages` + `removedImageIds`), re-validates slug uniqueness and category/brand references, supports offer price + variants. Can toggle `isActive` both ways.
- **Delete product** – Admin-only. Soft-deletes by setting `isDeleted: true` and `isActive: false` (not toggleable back via delete).

### Slug rules
- If a slug is **provided**, it is rejected (409) only if it belongs to a product with a **different name**. Products with the same name (different price/variant) may share the slug.
- If **omitted**, a slug is generated from the name (lowercased, hyphenated). If the base slug is taken by a different-named product, a unique random-suffixed slug is generated instead.
- A name with no letters/numbers → 400.

### Currency
Products **inherit** the store's currency from the settings brand (`brand.currency`) — the admin picks the store currency in settings, and new products automatically carry it. Orders inherit the currency of their products. Changing the store currency affects new products only.

### Offer price
An optional `offerPrice` sub-doc: `{ type: "flat" | "percentage", value, startAt, endAt, isActive }`. `endAt` must be after `startAt` (else 400). The frontend computes the effective sale price: flat = `price - value`, percentage = `price - (price * value / 100)`.

### Variants
Products can have a single default price/stock (no variants) or multiple `variants` (`hasVariants: true`). Each variant has `sku`, `attributes` (e.g. `{ Color: "Black", Size: "M" }`), optional `price` (falls back to product price), `stock`, `imageUrls`, `isActive`. SKUs are auto-generated as `{PRODUCT_PREFIX}-{COLOR}-{SIZE}-{RANDOM}` when not provided (e.g. `SMAR-BLACK-M-7F3K9Q`). `colorOptions` stores the display palette (`{ name, hex }`). `attributes` lists the variant axes (`[{ key: "Color", values: ["Black", "White"] }, { key: "Size", values: ["S", "M", "L"] }]`) so the storefront can render filters/selectors; each variant's `attributes` map must draw its keys from these definitions.

**Variant images** use the same `{ publicId, url, order }` shape as the main product images (`order: 0` = first/cover for that variant). Send the full image list per variant on create/update; on update, providing only `{ publicId, order }` preserves the existing `url` from the stored variant (matched by `publicId`). Plain URL strings are also accepted and normalized to objects with sequential order.

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
            "imageUrls": [
                { "publicId": "demo-ecommerce/abc123", "url": "https://res.cloudinary.com/.../image1.jpg", "order": 0 },
                { "publicId": "demo-ecommerce/def456", "url": "https://res.cloudinary.com/.../image2.jpg", "order": 1 }
            ],
            "offerPrice": null,
            "colorOptions": [ { "name": "Black", "hex": "#000000" }, { "name": "White", "hex": "#FFFFFF" } ],
            "attributes": [ { "key": "Color", "values": ["Black", "White"] }, { "key": "Size", "values": ["S", "M", "L"] } ],
            "variants": [
                {
                    "sku": "SMAR-BLACK-M-7F3K9Q",
                    "attributes": { "Color": "Black", "Size": "M" },
                    "price": 799.99,
                    "stock": 20,
                    "imageUrls": [
                        { "publicId": "demo-ecommerce/variant-red", "url": "https://res.cloudinary.com/.../variant-red.jpg", "order": 0 }
                    ],
                    "isActive": true
                }
            ],
            "hasVariants": true,
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
Note: Only non-deleted products are returned. Only non-flagged reviews are populated. `createdBy` is attached on create (admin id). `imageUrls` is now an array of `{ publicId, url, order }` objects — `order: 0` is the cover image.

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
  data: {
    "name": "Smartphone X", "slug": "smartphone-x" (optional), "description": "...",
    "price": 799.99, "stock": 50, "weight": 0.2,
    "category": "cat_id", "brand": "brand_id",
    "specification": [{"key":"RAM","value":"8GB"}], "keyFeatures": ["5G"],
    "colorOptions": [{ "name": "Black", "hex": "#000000" }],
    "attributes": [{ "key": "Color", "values": ["Black", "White"] }, { "key": "Size", "values": ["S", "M", "L"] }],
    "hasVariants": true,
    "variants": [
      { "attributes": { "Color": "Black", "Size": "M" }, "price": 799.99, "stock": 20, "imageUrls": [{ "publicId": "v1", "url": "https://.../black-m.jpg", "order": 0 }] }
    ],
    "offerPrice": { "type": "flat", "value": 50, "startAt": "2026-08-01", "endAt": "2026-08-31", "isActive": true }
  }
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
Note: **No `currency` field** — it inherits from the store's brand settings. `slug` optional. Variant `sku` is auto-generated when omitted. `offerPrice.endAt` must be after `startAt` (400 otherwise). Uploaded images become `{ publicId, url, order }` objects in the order uploaded.

### PATCH /api/v1/product/:productId (Update Product)
**Request — image management (multipart):**
```
PATCH /api/v1/product/prod_id
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: {
    "name": "Smartphone X Pro", "price": 899.99, "isActive": true,
    "keepImages": [ { "publicId": "demo-ecommerce/abc123", "order": 1 }, { "publicId": "demo-ecommerce/def456", "order": 0 } ],
    "removedImageIds": ["demo-ecommerce/ghi789"],
    "offerPrice": { "type": "percentage", "value": 10, "startAt": "2026-08-01", "endAt": "2026-08-31" },
    "variants": [ { "sku": "SMAR-BLACK-M-7F3K9Q", "attributes": { "Color": "Black", "Size": "M" }, "stock": 15, "imageUrls": [{ "publicId": "demo-ecommerce/variant-red", "order": 0 }] } ]
  }
  images: [new file1, new file2]   // appended after kept images
```

**How image updates work:**
- `keepImages` — the existing images you want to KEEP, with their new `order` (reorder by changing `order`; `0` = cover/first).
- `images` (multipart files) — new uploads, appended after the kept images' max order.
- `removedImageIds` — Cloudinary publicIds to **delete from Cloudinary** and drop from the product.
- If `keepImages`/`images` are absent, the current images stay untouched.
- **Variant images** — send the full `imageUrls` list per variant (objects `{ publicId, url, order }`, or plain URL strings which get normalized). Only `{ publicId, order }` is enough for existing images — the `url` is backfilled from the stored variant by `publicId`.

**Response:**
```json
{
    "success": true,
    "message": "Product updated successfully",
    "data": { "...": "updated product" }
}
```
Note: `isActive` can be toggled `true`/`false` freely. `slug` optional — same uniqueness rules as create. `offerPrice`, `colorOptions`, `attributes`, `variants`, and `hasVariants` are all updatable.

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
