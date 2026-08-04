# Settings Module

## Overview
The Settings module manages all site-wide configuration as a **single singleton Mongoose document** (fixed `_id: "singleton"`). It holds brand identity (name, tagline, description, logo, favicon) plus typed per-section sub-documents for `theme`, `hero`, `navbar`, and `footer`. The whole config is readable in one request, and each section can be updated independently by an admin.

## How It Works
- **Singleton document** – One document, one `_id` (`"singleton"`). Created at deploy time via the seed script (`npm run seed:settings`); never created lazily on first request (avoids a duplicate-`_id` race).
- **Get settings** – Public route. Returns the whole singleton, cached in memory; the second read is served from cache until a write invalidates it.
- **Update brand fields** – Admin-only. Updates `brandName`, `tagline`, `description`, `logo` (file upload supported), `favicon` via `$set` on the top-level fields.
- **Update section** – Admin-only. Updates a single typed section (`theme`, `hero`, `navbar`, or `footer`) via `$set` with `runValidators: true`, so Mongoose validates the section shape on save. Unknown section → 400, invalid body → 400.
- **Cache invalidation** – Every write invalidates the in-memory cache. The cache is single-instance only; use Redis (or a short TTL) when running multiple server instances.
- **Concurrency** – The schema uses `optimisticConcurrency: true` to avoid silent last-write-wins on concurrent admin edits.
- **Rule going forward** – Settings holds singleton, site-wide config only. Anything that grows as a list of records (products, posts, banners) belongs in its own module/collection — do not add arrays-of-many here.

## Test Data

### GET /api/v1/settings (Get Settings — Public)
**Request:**
```
GET /api/v1/settings
```
No auth required — the storefront/frontend needs this to render.

**Response:**
```json
{
    "success": true,
    "message": "Settings retrieved successfully",
    "data": {
        "_id": "singleton",
        "brandName": "Demo Shop",
        "tagline": "Your one-stop shop",
        "description": "Best products at best prices",
        "logo": "https://res.cloudinary.com/.../logo.png",
        "favicon": "https://res.cloudinary.com/.../favicon.ico",
        "theme": {
            "primaryColor": "#000000",
            "secondaryColor": "#ffffff",
            "fontFamily": "",
            "logoUrl": ""
        },
        "hero": {
            "title": "Welcome",
            "subtitle": "",
            "backgroundImage": "",
            "ctaText": "",
            "ctaLink": ""
        },
        "navbar": {
            "links": []
        },
        "footer": {
            "links": [],
            "copyrightText": "",
            "socialLinks": []
        },
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
    }
}
```
If not seeded yet, returns 404 with `"Settings not seeded. Run the settings seed script."`

### PATCH /api/v1/settings (Update Brand Fields — Admin)
**Request:**
```
PATCH /api/v1/settings
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: { "brandName": "Demo Shop Pro", "tagline": "New tagline", "description": "...", "favicon": "https://.../favicon.ico" }
  logo: [optional file upload]
```

**Response:**
```json
{
    "success": true,
    "message": "Settings updated successfully",
    "data": {
        "_id": "singleton",
        "brandName": "Demo Shop Pro",
        "tagline": "New tagline",
        "...": "rest of settings object"
    }
}
```

### PATCH /api/v1/settings/hero (Update Section — Admin)
**Request:**
```
PATCH /api/v1/settings/hero
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "title": "New Hero Title",
    "subtitle": "Summer Sale",
    "backgroundImage": "https://res.cloudinary.com/.../hero.jpg",
    "ctaText": "Shop Now",
    "ctaLink": "/shop"
}
```

**Response:**
```json
{
    "success": true,
    "message": "hero settings updated successfully",
    "data": {
        "_id": "singleton",
        "brandName": "Demo Shop",
        "hero": {
            "title": "New Hero Title",
            "subtitle": "Summer Sale",
            "backgroundImage": "https://res.cloudinary.com/.../hero.jpg",
            "ctaText": "Shop Now",
            "ctaLink": "/shop"
        },
        "...": "rest of settings object"
    }
}
```

**Other sections (same pattern, different body shape):**
- `PATCH /api/v1/settings/theme` — `{ "primaryColor": "#1a1a1a", "secondaryColor": "#f5f5f5", "fontFamily": "Inter", "logoUrl": "..." }`
- `PATCH /api/v1/settings/navbar` — `{ "links": [{ "label": "Home", "url": "/", "order": 0 }] }`
- `PATCH /api/v1/settings/footer` — `{ "links": [...], "copyrightText": "© 2025", "socialLinks": [{ "platform": "facebook", "url": "..." }] }`

## Seeding
Run once after DB provisioning (or in CI/CD before first deploy):
```bash
npm run seed:settings
```
This creates the singleton document if it does not exist; if it already exists it skips.

## Notes
- `GET /settings` is **public**; all writes (`PATCH /`, `PATCH /:section`) require the `admin` role via the `auth` middleware.
- The in-memory cache is invalidated on every write. For multi-instance deployments, swap `settings.cache.ts` for Redis (or add a TTL).
- Sections are typed sub-schemas (`{ _id: false }`) — no generic `content` blob. Adding a new config area means adding a new typed sub-schema + a `SETTINGS_SECTIONS` entry.
