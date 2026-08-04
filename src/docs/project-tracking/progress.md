# Created at: 04/08/2026
# Updated at: 04/08/2026
# Completed at: N/A

# Modules Testing
Total Module: 11
Total Routes: 50

Base URL: `http://localhost:5000/api/v1` (all routes are prefixed with `/api/v1`)

---

## 1. User Module (Completed ✔)
**Total Routes: 5**

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/user/register` | POST | Register a new user (customer only). Auto-login returns access token. Tracks client info (device, browser, IP). |
| 2 | `/user` | GET | Get all users except the requesting admin (Admin only). Supports search, filter, sort, pagination via QueryBuilder. |
| 3 | `/user/me` | GET | Get logged-in user's own profile (Admin/Customer). |
| 4 | `/user/update-profile` | PATCH | Update own profile (Admin/Manager/Customer). Supports profile photo upload via Multer/Cloudinary. |
| 5 | `/user/:id/status` | PATCH | Toggle user active/inactive status (Admin only). |

### 1.1 POST /user/register — Register User
```text
POST /api/v1/user/register
Content-Type: application/json

{
    "name": "John Doe",
    "email": "customer@example.com",
    "password": "123456",
    "clientInfo": {
        "device": "pc",
        "browser": "Chrome",
        "ipAddress": "192.168.1.1",
        "os": "Windows",
        "userAgent": "Mozilla/5.0..."
    }
}
```
Note: clientInfo is auto-captured via the `clientInfoParser` middleware; the shape above is what it populates.

```json
// Response 201 Created
{
    "success": true,
    "message": "User registration completed successfully!",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

### 1.2 GET /user — Get All Users (Admin)
```text
GET /api/v1/user?searchTerm=john&page=1&limit=10
Authorization: Bearer <admin_token>
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Users are retrieved successfully",
    "meta": { "page": 1, "limit": 10, "total": 1, "totalPage": 1 },
    "data": [
        {
            "_id": "user_id",
            "name": "John Doe",
            "email": "customer@example.com",
            "role": "customer",
            "photoUrl": null,
            "isActive": true,
            "lastLogin": "2025-01-01T00:00:00.000Z",
            "createdAt": "2025-01-01T00:00:00.000Z",
            "updatedAt": "2025-01-01T00:00:00.000Z"
        }
    ]
}
```

### 1.3 GET /user/me — My Profile
```text
GET /api/v1/user/me
Authorization: Bearer <access_token>
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "customer@example.com",
        "role": "customer",
        "photoUrl": null,
        "clientInfo": {
            "device": "pc",
            "browser": "Chrome",
            "ipAddress": "192.168.1.1",
            "os": "Windows",
            "userAgent": "Mozilla/5.0..."
        },
        "lastLogin": "2025-01-01T00:00:00.000Z",
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```

### 1.4 PATCH /user/update-profile — Update Profile
```text
PATCH /api/v1/user/update-profile
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Fields:
  name: "John Updated"
  phoneNo: "01712345678"
  gender: "Male"
  dateOfBirth: "1990-01-01"
  address: "123 Main Street, Dhaka"
  profilePhoto: [file upload]
```
Note: All fields optional. `phoneNo` (11 digits), `gender` (`Male`/`Female`/`Other`), `dateOfBirth` (valid date), `photo`/`photoUrl` (image URL) are validated; uploaded `profilePhoto` sets `photoUrl`.
```json
// Response 200 OK
{
    "success": true,
    "message": "Profile updated successfully",
    "data": {
        "_id": "user_id",
        "name": "John Updated",
        "photoUrl": "https://res.cloudinary.com/.../profile.jpg",
        "email": "customer@example.com",
        "role": "customer",
        "isActive": true,
        "lastLogin": "2025-01-01T00:00:00.000Z",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-02T00:00:00.000Z"
    }
}
```

### 1.5 PATCH /user/:id/status — Update User Status (Admin)
```text
PATCH /api/v1/user/user_id/status
Authorization: Bearer <admin_token>
```
```json
// Response 200 OK (if deactivating)
{
    "success": true,
    "message": "User is now inactive",
    "data": {
        "_id": "user_id",
        "isActive": false,
        "name": "John Doe",
        "email": "customer@example.com"
    }
}
```

---

## 2. Auth Module (Completed ✔)
**Total Routes: 6**

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/auth/login` | POST | Login with email/password. Tracks client info, updates last login, returns access + refresh tokens (refresh in httpOnly cookie). |
| 2 | `/auth/refresh-token` | POST | Exchange valid refresh token (cookie) for a new access token. |
| 3 | `/auth/change-password` | POST | Change own password (Admin/Customer). Validates old password; new password must differ from old, min 6 chars. |
| 4 | `/auth/forgot-password` | POST | Send 6-digit OTP to user's email (signed JWT, 5-min expiry). |
| 5 | `/auth/verify-otp` | POST | Verify OTP from email; returns a reset token on success. |
| 6 | `/auth/reset-password` | POST | Accept reset token + new password, updates password. |

### 2.1 POST /auth/login — Login
```text
POST /api/v1/auth/login
Content-Type: application/json

{
    "email": "customer@example.com",
    "password": "123456"
}
```
Note: clientInfo auto-captured via `clientInfoParser` middleware. Validation: valid email format, password min 6 chars.

```json
// Response 200 OK
{
    "success": true,
    "message": "User logged in successfully!",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

### 2.2 POST /auth/refresh-token — Refresh Token
```text
POST /api/v1/auth/refresh-token
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIs...
```
```json
// Response 200 OK
{
    "success": true,
    "message": "User logged in successfully!",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

### 2.3 POST /auth/change-password — Change Password
```text
POST /api/v1/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "oldPassword": "123456",
    "newPassword": "newpassword123"
}
```
Note: Both passwords required, min 6 chars, and `newPassword` must differ from `oldPassword` (validated in zod + service).
```json
// Response 200 OK
{
    "success": true,
    "message": "Password changed successfully!",
    "data": null
}
```

### 2.4 POST /auth/forgot-password — Forgot Password
```text
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
    "email": "customer@example.com"
}
```
Note: `email` must be a valid email format.
```json
// Response 200 OK
{
    "success": true,
    "message": "Check your email to reset your password",
    "data": null
}
```

### 2.5 POST /auth/verify-otp — Verify OTP
```text
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
    "email": "customer@example.com",
    "otp": "483291"
}
```
Note: `otp` must be exactly 4 digits (matches `generateOtp`).
```json
// Response 200 OK
{
    "success": true,
    "message": "OTP verified successfully.",
    "data": {
        "resetToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

### 2.6 POST /auth/reset-password — Reset Password
```text
POST /api/v1/auth/reset-password
Content-Type: application/json

{
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "newPassword": "newpassword123"
}
```
Note: `newPassword` required, min 6 chars.
```json
// Response 200 OK
{
    "success": true,
    "message": "Password reset successfully!",
    "data": {
        "message": "Password changed successfully"
    }
}
```

---

## 3. Product Module (Completed ✔)
**Total Routes: 5**

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/product` | GET | Get all non-deleted products (public). Populates category/brand. Supports search, filter, sort, price-range, pagination. |
| 2 | `/product/:productId` | GET | Get single non-deleted product (public). Populates category/brand. |
| 3 | `/product` | POST | Create product (Admin). Up to 10 images via Multer/Cloudinary. Slug optional — auto-generated unique; validates category/brand refs. |
| 4 | `/product/:productId` | PATCH | Update product (Admin). Replaces image array, re-validates slug + refs. Can toggle `isActive` both ways. |
| 5 | `/product/:productId` | DELETE | Soft-delete product (Admin). Sets `isDeleted: true`, `isActive: false`. Not toggleable. |

Slug rules: a provided slug is rejected only if it belongs to a product with a **different name**. Same-name products (different price/variant) may share the slug. If no slug is provided, a unique one is generated from the name (`<name>-<random>` when the base slug is taken).

### 3.1 GET /product — Get All Products (Public)
```text
GET /api/v1/product?searchTerm=phone&minPrice=100&maxPrice=1000&page=1&limit=10
```
```json
// Response 200 OK
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

### 3.2 GET /product/:productId — Get Single Product (Public)
```text
GET /api/v1/product/prod_id
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Product retrieved successfully",
    "data": { "...": "same structure as list item above" }
}
```
Note: 404 if the product does not exist or has been soft-deleted (`isDeleted: true`).

### 3.3 POST /product — Create Product (Admin)
```text
POST /api/v1/product
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: { "name": "Smartphone X", "slug": "smartphone-x" (optional), "description": "...", "price": 799.99, "stock": 50, "weight": 0.2, "category": "cat_id", "brand": "brand_id", "specification": [{"key":"RAM","value":"8GB"}], "keyFeatures": ["5G"], "availableColors": ["Black","White"] }
  images: [file1, file2, ...] (max 10)
```
```json
// Response 201 Created
{
    "success": true,
    "message": "Product created successfully",
    "data": { "...": "product object with populated category/brand" }
}
```
Note: `slug` optional. If omitted, auto-generated from `name` (base slug if free, else `-<random>` suffix). If provided, it must not belong to a different-named product.

### 3.4 PATCH /product/:productId — Update Product (Admin)
```text
PATCH /api/v1/product/prod_id
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: { "name": "Smartphone X Pro", "slug": "smartphone-x-pro", "price": 899.99, "isActive": true }
  images: [new images]
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Product updated successfully",
    "data": { "...": "updated product" }
}
```
Note: `isActive` can be toggled `true`/`false` freely (an inactive product can be re-activated). `slug` optional — same uniqueness rules as create.

### 3.5 DELETE /product/:productId — Delete Product (Admin)
```text
DELETE /api/v1/product/prod_id
Authorization: Bearer <admin_token>
```
```json
// Response 200 OK
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

---

## 4. Order Module
**Total Routes: 4**

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/order` | GET | Get all orders (Admin). Populates user + product. Search/filter/sort/paginate. |
| 2 | `/order/:orderId` | GET | Get order details (Admin or order owner). Full user + product population. |
| 3 | `/order` | POST | Create order (Admin/Customer). Validates product active + stock; decrements stock. |
| 4 | `/order/:orderId/status` | PATCH | Change order status (Admin). Locked once Cancelled/Completed. |

Status lifecycle: `Pending` → `Processing` → `Shipped` → `Completed` (or `Cancelled`).

### 4.1 GET /order — Get All Orders (Admin)
```text
GET /api/v1/order?status=Pending&page=1&limit=10
Authorization: Bearer <admin_token>
```
```json
// Response 200 OK
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

### 4.2 GET /order/:orderId — Get Order Details (Admin/Owner)
```text
GET /api/v1/order/order_id
Authorization: Bearer <admin_token or customer_token>
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Order details retrieved successfully",
    "data": { "...": "same structure as list item above" }
}
```

### 4.3 POST /order — Create Order (Admin/Customer)
```text
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
```json
// Response 201 Created
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

### 4.4 PATCH /order/:orderId/status — Update Order Status (Admin)
```text
PATCH /api/v1/order/order_id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "status": "Processing"
}
```
```json
// Response 200 OK
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

---

## 5. Meta Module
**Total Routes: 1**

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/meta` | GET | Dashboard metadata & analytics (Admin). Aggregates counts across users, products, orders, revenue, categories, brands, reviews, recent orders, low stock. |

### 5.1 GET /meta — Get Metadata (Admin)
```text
GET /api/v1/meta
Authorization: Bearer <admin_token>
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Metadata retrieved successfully",
    "data": {
        "totalProducts": 25,
        "totalOrders": 150,
        "totalUsers": 42,
        "totalRevenue": 125000.00,
        "totalCategories": 8,
        "totalBrands": 12,
        "totalReviews": 67,
        "recentOrders": 18,
        "lowStockProducts": 3
    }
}
```

---

## 6. Brand Module (Completed ✔)
**Total Routes: 5**

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/brand` | GET | Get all active brands (public). Supports search + pagination. |
| 2 | `/brand/:id` | GET | Get single brand (public). 404 if not found or soft-deleted. |
| 3 | `/brand` | POST | Create brand (Admin). Validates name uniqueness (case-insensitive). Logo upload. |
| 4 | `/brand/:id` | PATCH | Update brand (Admin). Re-checks name uniqueness. Logo upload. |
| 5 | `/brand/:id` | DELETE | Soft-delete brand (Admin). Sets `isDeleted: true`, `isActive: false`. |

### 6.1 GET /brand — Get All Brands (Public)
```text
GET /api/v1/brand?searchTerm=nike&page=1&limit=10
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Brands retrieved successfully",
    "meta": { "page": 1, "limit": 10, "total": 2, "totalPage": 1 },
    "data": [
        {
            "_id": "brand_id_1",
            "name": "Nike",
            "description": "Sports apparel and footwear",
            "logo": "https://example.com/nike.png",
            "isActive": true,
            "createdBy": { "_id": "user_id", "name": "Admin", "email": "admin@example.com" },
            "createdAt": "2025-01-01T00:00:00.000Z",
            "updatedAt": "2025-01-01T00:00:00.000Z"
        }
    ]
}
```

### 6.2 GET /brand/:id — Get Single Brand (Public)
```text
GET /api/v1/brand/brand_id_1
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Brand retrieved successfully",
    "data": { "...": "same structure as list item above" }
}
```

### 6.3 POST /brand — Create Brand (Admin)
```text
POST /api/v1/brand
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data   // or application/json

Fields (multipart):
  name: "Nike"
  description: "Sports apparel and footwear" (optional, defaults "")
  logo: [file upload]

// or JSON body:
{
    "name": "Nike",
    "description": "Sports apparel and footwear"
}
```
```json
// Response 201 Created
{
    "success": true,
    "message": "Brand created successfully",
    "data": {
        "_id": "brand_id_1",
        "name": "Nike",
        "description": "Sports apparel and footwear",
        "logo": "https://example.com/nike.png",
        "isActive": true,
        "createdBy": "user_id",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```

### 6.4 PATCH /brand/:id — Update Brand (Admin)
```text
PATCH /api/v1/brand/brand_id_1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "name": "Nike Updated",
    "description": "Updated description"
}
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Brand updated successfully",
    "data": {
        "_id": "brand_id_1",
        "name": "Nike Updated",
        "description": "Updated description",
        "logo": "https://example.com/nike.png",
        "isActive": true,
        "createdBy": "user_id",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```

### 6.5 DELETE /brand/:id — Delete Brand (Admin)
```text
DELETE /api/v1/brand/brand_id_1
Authorization: Bearer <admin_token>
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Brand deleted successfully",
    "data": {
        "_id": "brand_id_1",
        "name": "Nike Updated",
        "description": "Updated description",
        "logo": "https://example.com/nike.png",
        "isActive": false,
        "isDeleted": true,
        "createdBy": "user_id",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```

---

## 7. Category Module (Completed ✔)
**Total Routes: 4**

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/category` | GET | Get all active categories (public). Supports parent/subcategory hierarchy. |
| 2 | `/category` | POST | Create category (Admin). Auto-generates slug; validates parent. Icon upload. |
| 3 | `/category/:id` | PATCH | Update category (Admin). Re-validates name uniqueness + parent ref. Icon upload. |
| 4 | `/category/:id` | DELETE | Delete category (Admin). Prevents deletion if subcategories exist; soft-delete. |

### 7.1 GET /category — Get All Categories (Public)
```text
GET /api/v1/category?searchTerm=electronics
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Categories retrieved successfully",
    "meta": { "page": 1, "limit": 10, "total": 2, "totalPage": 1 },
    "data": [
        {
            "_id": "cat_1",
            "name": "Electronics",
            "slug": "electronics",
            "description": "Electronic devices and accessories",
            "parent": null,
            "isActive": true,
            "createdBy": { "_id": "user_id", "name": "Admin", "email": "admin@example.com" },
            "icon": "electronics-icon.png",
            "createdAt": "2025-01-01T00:00:00.000Z",
            "updatedAt": "2025-01-01T00:00:00.000Z"
        }
    ]
}
```

### 7.2 POST /category — Create Category (Admin)
```text
POST /api/v1/category
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data   // or application/json

Fields (multipart):
  name: "Electronics"
  description: "Electronic devices and accessories"
  icon: [file upload]

// or JSON body:
{
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "icon": "electronics-icon.png"
}
```
```json
// Response 201 Created
{
    "success": true,
    "message": "Category created successfully",
    "data": {
        "_id": "cat_1",
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices and accessories",
        "parent": null,
        "isActive": true,
        "createdBy": "user_id",
        "icon": "electronics-icon.png",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```

### 7.3 PATCH /category/:id — Update Category (Admin)
```text
PATCH /api/v1/category/cat_1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "description": "Updated description"
}
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Category updated successfully",
    "data": { "...": "updated category object" }
}
```

### 7.4 DELETE /category/:id — Delete Category (Admin)
```text
DELETE /api/v1/category/cat_1
Authorization: Bearer <admin_token>
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Category deleted successfully",
    "data": {
        "_id": "cat_1",
        "isActive": false,
        "...": "rest of category fields"
    }
}
```

---

## 8. Coupon Module
**Total Routes: 5**

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/coupon` | POST | Create coupon (Admin). Percentage/fixed discount, min order, max discount, validity dates. |
| 2 | `/coupon` | GET | Get all coupons (Admin). Paginated. |
| 3 | `/coupon/:couponCode` | GET | Get coupon by code (public). Validates date range + active status. |
| 4 | `/coupon/:couponCode/update-coupon` | PATCH | Update coupon (Admin). |
| 5 | `/coupon/:couponId` | DELETE | Soft-delete coupon (Admin). Sets `isDeleted: true`, `isActive: false`. |

### 8.1 POST /coupon — Create Coupon (Admin)
```text
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
```json
// Response 201 Created
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

### 8.2 GET /coupon — Get All Coupons (Admin)
```text
GET /api/v1/coupon
Authorization: Bearer <admin_token>
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Coupons retrieved successfully",
    "meta": { "page": 1, "limit": 10, "total": 1, "totalPage": 1 },
    "data": [{ "_id": "coupon_id", "code": "SAVE20", "...": "rest of coupon fields" }]
}
```

### 8.3 GET /coupon/:couponCode — Get Coupon By Code (Public)
```text
GET /api/v1/coupon/SAVE20
```
```json
// Response 200 OK
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

### 8.4 PATCH /coupon/:couponCode/update-coupon — Update Coupon (Admin)
```text
PATCH /api/v1/coupon/SAVE20/update-coupon
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "discountValue": 25,
    "maxDiscountAmount": 250
}
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Coupon updated successfully",
    "data": { "...": "updated coupon object" }
}
```

### 8.5 DELETE /coupon/:couponId — Delete Coupon (Admin)
```text
DELETE /api/v1/coupon/coupon_id
Authorization: Bearer <admin_token>
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Coupon deleted successfully",
    "data": {
        "_id": "coupon_id",
        "isDeleted": true,
        "isActive": false,
        "...": "rest of coupon fields"
    }
}
```

---

## 9. Review Module (Completed ✔)
**Total Routes: 3**

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/review` | GET | Get all reviews (public). Populates user + product. |
| 2 | `/review/:reviewId` | GET | Get single review (public). |
| 3 | `/review` | POST | Create review (Admin/Customer). One review per user per product; syncs product's averageRating + ratingCount. |

### 9.1 GET /review — Get All Reviews (Public)
```text
GET /api/v1/review?page=1&limit=10
```
```json
// Response 200 OK
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

### 9.2 GET /review/:reviewId — Get Single Review (Public)
```text
GET /api/v1/review/review_id_1
```
```json
// Response 200 OK
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

### 9.3 POST /review — Create Review (Admin/Customer)
```text
POST /api/v1/review
Authorization: Bearer <user_token>
Content-Type: application/json

{
    "rating": 4,
    "description": "Great product! Highly recommended.",
    "product": "product_id"
}
```
```json
// Response 201 Created
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

---

## 10. Payment Module
**Total Routes: 7**

Providers: Stripe (international), SSLCommerz (Bangladesh), bKash (Bangladesh mobile banking).

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/payment/:orderId/stripe/init` | POST | Initiate Stripe payment (Admin/Customer). Returns `paymentIntentId` + `clientSecret`. |
| 2 | `/payment/stripe/success` | GET/POST | Stripe success callback (`router.all`). Validates PaymentIntent, marks order Paid/Processing. |
| 3 | `/payment/stripe/cancel` | GET/POST | Stripe cancel callback (`router.all`). Validates PaymentIntent status. |
| 4 | `/payment/:orderId/sslcommerz/init` | POST | Initiate SSLCommerz payment (Admin/Customer). Returns gateway URL + session key. |
| 5 | `/payment/sslcommerz/validate` | GET/POST | SSLCommerz validate callback (`router.all`). Uses `val_id`; updates order on success. |
| 6 | `/payment/:orderId/bkash/init` | POST | Initiate bKash payment (Admin/Customer). Tokenized checkout; returns gateway URL. |
| 7 | `/payment/bkash/validate` | POST | Validate bKash payment (Admin/Customer). Uses `paymentID`; executes payment. |

### 10.1 POST /payment/:orderId/stripe/init — Initiate Stripe (Admin/Customer)
```text
POST /api/v1/payment/order_id_123/stripe/init
Authorization: Bearer <token>
Content-Type: application/json

{
    "amount": 1500,
    "currency": "usd"
}
```
```json
// Response 200 OK
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

### 10.2 GET|POST /payment/stripe/success — Stripe Success Callback
```text
GET /api/v1/payment/stripe/success?payment_intent=pi_3Rabc123...   // or POST with body
// GET /api/v1/payment/stripe/success  → browser redirect after Checkout
```
```json
// Response 200 OK
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

### 10.3 GET|POST /payment/stripe/cancel — Stripe Cancel Callback
```text
GET /api/v1/payment/stripe/cancel?payment_intent=pi_3Rabc123...
```
```json
// Response 200 OK
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

### 10.4 POST /payment/:orderId/sslcommerz/init — Initiate SSLCommerz (Admin/Customer)
```text
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
```json
// Response 200 OK
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

### 10.5 GET|POST /payment/sslcommerz/validate — SSLCommerz Validate Callback
```text
// POST (SSLCommerz server) or GET (browser redirect)
POST /api/v1/payment/sslcommerz/validate
Content-Type: application/json

{
    "val_id": "val_id_from_callback"
}
```
```json
// Response 200 OK
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

### 10.6 POST /payment/:orderId/bkash/init — Initiate bKash (Admin/Customer)
```text
POST /api/v1/payment/order_id_123/bkash/init
Authorization: Bearer <token>
Content-Type: application/json

{
    "amount": 1500,
    "customerNumber": "01712345678"
}
```
```json
// Response 200 OK
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

### 10.7 POST /payment/bkash/validate — Validate bKash (Admin/Customer)
```text
POST /api/v1/payment/bkash/validate
Authorization: Bearer <token>
Content-Type: application/json

{
    "paymentID": "bkash_payment_id_from_callback"
}
```
```json
// Response 200 OK
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

---

## 11. Settings Module
**Total Routes: 5**

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/settings` | GET | Get settings (public). Returns latest non-deleted settings doc. |
| 2 | `/settings` | POST | Create settings (Admin). Brand name required; tagline, description, logo upload, favicon, sections array. |
| 3 | `/settings/:id` | PATCH | Update settings (Admin). Logo upload supported. |
| 4 | `/settings/:id/section/:sectionKey` | PATCH | Update a single section by its key (Admin). Image upload supported. |
| 5 | `/settings/:id` | DELETE | Soft-delete settings (Admin). Sets `isDeleted: true`. |

### 11.1 GET /settings — Get Settings (Public)
```text
GET /api/v1/settings
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Settings retrieved successfully",
    "data": {
        "_id": "settings_id",
        "brandName": "Demo Shop",
        "tagline": "Your one-stop shop",
        "description": "Best products at best prices",
        "logo": "https://res.cloudinary.com/.../logo.png",
        "favicon": "https://res.cloudinary.com/.../favicon.ico",
        "sections": [
            {
                "_id": "section_id",
                "key": "hero",
                "title": "Welcome",
                "subtitle": "Summer Sale",
                "description": "Up to 50% off",
                "image": "https://res.cloudinary.com/.../hero.jpg",
                "content": {},
                "isActive": true
            }
        ],
        "isDeleted": false,
        "createdBy": "user_id",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```

### 11.2 POST /settings — Create Settings (Admin)
```text
POST /api/v1/settings
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: {
      "brandName": "Demo Shop",
      "tagline": "Your one-stop shop",
      "description": "Best products at best prices",
      "favicon": "https://.../favicon.ico",
      "sections": [
          {
              "key": "hero",
              "title": "Welcome",
              "subtitle": "Summer Sale",
              "description": "Up to 50% off",
              "content": { "buttonText": "Shop Now" },
              "isActive": true
          }
      ]
  }
  logo: [file upload]
```
```json
// Response 201 Created
{
    "success": true,
    "message": "Settings created successfully",
    "data": { "...": "settings object as in GET response" }
}
```

### 11.3 PATCH /settings/:id — Update Settings (Admin)
```text
PATCH /api/v1/settings/settings_id
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: { "brandName": "Demo Shop Pro", "tagline": "New tagline" }
  logo: [optional file upload]
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Settings updated successfully",
    "data": { "...": "updated settings object" }
}
```

### 11.4 PATCH /settings/:id/section/:sectionKey — Update Settings Section (Admin)
```text
PATCH /api/v1/settings/settings_id/section/hero
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: { "title": "New Hero Title", "isActive": true }
  image: [optional file upload]
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Section updated successfully",
    "data": {
        "_id": "section_id",
        "key": "hero",
        "title": "New Hero Title",
        "subtitle": "Summer Sale",
        "description": "Up to 50% off",
        "image": "https://res.cloudinary.com/.../hero.jpg",
        "content": { "buttonText": "Shop Now" },
        "isActive": true
    }
}
```

### 11.5 DELETE /settings/:id — Delete Settings (Admin)
```text
DELETE /api/v1/settings/settings_id
Authorization: Bearer <admin_token>
```
```json
// Response 200 OK
{
    "success": true,
    "message": "Settings deleted successfully",
    "data": {
        "_id": "settings_id",
        "isDeleted": true,
        "...": "rest of settings fields"
    }
}
```

---

## Route Summary

| Module | Total Routes |
|--------|--------------|
| User | 5 |
| Auth | 6 |
| Product | 5 |
| Order | 4 |
| Meta | 1 |
| Brand | 4 |
| Category | 4 |
| Coupon | 5 |
| Review | 3 |
| Payment | 7 |
| Settings | 5 |
| **Total** | **49** |

---

## QA Notes / Observations

1. **Payment readme mismatch**: `payment.readme.md` documents a `/stripe/validate` route, but the actual route file uses `/stripe/success` and `/stripe/cancel` (both `router.all`). The readme should be updated to match the code.
2. **Stripe validate requires auth in code?** — `/stripe/success` and `/stripe/cancel` have no `auth` middleware (they are provider/browser callbacks), while `/bkash/validate` and both init routes do require auth. Worth confirming during QA whether bKash validate should be public for callback compatibility.
3. **Settings module has no readme** — consider adding `settings.readme.md` for parity with other modules.
4. **Open question (later work)**: Keep Settings as a generic key/value-section store, or split into specific sub-documents (theme, hero section, home page section, navbar, footer, etc.)?
5. When using multer it uploads image first then does validation of creating a product/brand/category or not, and it denies but the photo still is uploaded and on the cloud.