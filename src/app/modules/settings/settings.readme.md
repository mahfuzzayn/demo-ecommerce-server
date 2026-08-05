# Settings Module

## Overview
The Settings module manages all site-wide configuration as a **single singleton Mongoose document** (fixed `_id: "singleton"`). It holds the brand identity, theme, and all storefront sections: `brand`, `theme`, `hero`, `testimonials`, `navbar`, `footer`, `contact`, `about`, and `limitedOffer`. The whole config is readable in one request, and each section can be updated independently by an admin.

## How It Works
- **Singleton document** – One document, one `_id` (`"singleton"`). Created at deploy time via the seed script (`npm run seed:settings`), prefilled from the default niche preset (`perfume_oil`).
- **Get settings** – Public route. Returns the whole singleton, cached in memory; the second read is served from cache until a write invalidates it.
- **Update brand** – Admin-only. Updates the `brand` sub-doc (`name`, `tagline`, `description`, `niche`, `nicheLabel`, `logo` file upload, `favicon` file upload) via `$set`.
- **Update section** – Admin-only. Updates a single section (`theme`, `hero`, `testimonials`, `navbar`, `footer`, `contact`, `about`, `limitedOffer`) via `$set` with `runValidators: true`. Unknown section → 400, invalid body → 400.
- **Niche presets** – Admin-only `PATCH /settings/preset/:niche` applies a full preset (`clothing` | `perfume_oil` | `eyewear`) from `settings.presets.ts` in one write.
- **Image uploads** – Positional, same semantics as the Product module: re-send the whole section; uploaded files map by index (hero → `slides[i].image`, testimonials → `items[i].avatar`, about/limitedOffer → `image`).
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
        "brand": {
            "name": "Attor",
            "tagline": "Essence of Distinction",
            "description": "Premium perfume oils crafted for the discerning.",
            "niche": "perfume_oil",
            "nicheLabel": "Perfume Oil",
            "logo": "https://res.cloudinary.com/.../logo.png",
            "favicon": "https://res.cloudinary.com/.../favicon.ico"
        },
        "theme": {
            "colors": {
                "primary": "oklch(0.514 0.222 16.935)",
                "primaryForeground": "oklch(0.969 0.015 12.422)",
                "secondary": "oklch(0.967 0.001 286.375)",
                "background": "oklch(1 0 0)",
                "foreground": "oklch(0.145 0 0)",
                "border": "oklch(0.922 0 0)",
                "ring": "oklch(0.708 0 0)",
                "card": "oklch(1 0 0)",
                "popover": "oklch(1 0 0)",
                "...": "all 17 CSS variables from global.css"
            },
            "dark": { "enabled": true, "colors": { "...": "dark values" } },
            "fonts": { "family": "Inter", "sizes": { "h1": "2.5rem", "h2": "2rem", "h3": "1.5rem", "body": "1rem", "small": "0.875rem" } },
            "radius": "0.625rem",
            "globalCss": ""
        },
        "hero": {
            "slides": [
                {
                    "image": "https://res.cloudinary.com/.../hero-1.jpg",
                    "headline": "Discover Your Signature Scent",
                    "subtext": "Explore our curated collection...",
                    "ctaText": "Explore Collection",
                    "ctaLink": "/shop",
                    "order": 0
                }
            ]
        },
        "testimonials": {
            "heading": "What Our Customers Say",
            "items": [
                {
                    "name": "John Doe",
                    "role": "Verified Buyer",
                    "quote": "Amazing quality!",
                    "rating": 5,
                    "avatar": "https://.../avatar.jpg",
                    "order": 0
                }
            ]
        },
        "navbar": {
            "links": [
                { "label": "Shop", "url": "/shop", "order": 0, "children": [{ "label": "Men", "url": "/shop?category=men", "order": 0 }] }
            ],
            "groups": {
                "public": [{ "label": "Home", "url": "/" }],
                "auth": [{ "label": "Login", "url": "/login" }],
                "customer": [{ "label": "My Account", "url": "/account" }],
                "admin": [{ "label": "Admin", "url": "/admin" }]
            }
        },
        "footer": {
            "description": "Artisanal perfume oils...",
            "columns": [{ "title": "Shop", "links": [{ "label": "Oud", "url": "/shop?category=oud" }] }],
            "socialLinks": [{ "platform": "facebook", "url": "https://facebook.com/attor" }],
            "copyrightText": "© 2026 Attor. All rights reserved.",
            "newsletter": { "enabled": true, "heading": "Subscribe for exclusive offers" }
        },
        "contact": {
            "address": "123 Perfume Avenue, New York, NY 10001",
            "phone": "+1 (555) 123-4567",
            "email": "hello@attor.com",
            "hours": "Mon–Sat 9am–6pm",
            "mapEmbedUrl": "",
            "social": { "twitter": "https://twitter.com/attor", "instagram": "https://instagram.com/attor", "facebook": "https://facebook.com/attor" }
        },
        "about": {
            "story": "Attor began with a passion...",
            "mission": "We believe fragrance is the most intimate...",
            "image": "https://.../about.jpeg",
            "stats": [{ "label": "Founded", "value": "2018" }]
        },
        "limitedOffer": {
            "enabled": false,
            "badge": "Limited Time",
            "title": "Summer Sale",
            "subtitle": "Up to 50% off",
            "ctaText": "Shop Now",
            "ctaLink": "/sale",
            "image": "",
            "endsAt": "2026-08-31T23:59:59.000Z"
        },
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
    }
}
```
If not seeded yet, returns 404 with `"Settings not seeded. Run the settings seed script."`

### PATCH /api/v1/settings (Update Brand — Admin)
**Request:**
```
PATCH /api/v1/settings
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
  data: { "brand": { "name": "Attor", "tagline": "New tagline", "description": "...", "niche": "clothing", "nicheLabel": "Clothing" } }
  logo: [optional file upload]
  favicon: [optional file upload]
```

**Response:**
```json
{
    "success": true,
    "message": "Settings updated successfully",
    "data": { "_id": "singleton", "brand": { "...": "updated brand" }, "...": "rest of settings" }
}
```

### PATCH /api/v1/settings/hero (Update Section — Admin)
**Request:**
```
PATCH /api/v1/settings/hero
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "slides": [
        { "image": "https://.../hero.jpg", "headline": "New Hero Title", "subtext": "Summer Sale", "ctaText": "Shop Now", "ctaLink": "/shop", "order": 0 }
    ]
}
```
For image uploads, use multipart:
```
Content-Type: multipart/form-data

data: { "slides": [{ "headline": "Banner 1", "subtext": "...", "ctaText": "Shop", "ctaLink": "/shop", "order": 0 }, { "headline": "Banner 2", "...": "..." }] }
images: [file1, file2]   // mapped to slides[0].image, slides[1].image by index
```
Response shape mirrors the GET response — the whole updated document.

**Other sections (same pattern, different body shape):**
- `PATCH /api/v1/settings/theme` — `{ "colors": { "primary": "#1a1a1a" }, "dark": { "enabled": true }, "fonts": { "family": "Inter" }, "radius": "0.625rem", "globalCss": "..." }`
- `PATCH /api/v1/settings/testimonials` — `{ "heading": "...", "items": [{ "name": "...", "quote": "...", "rating": 5 }] }` (+ `images` for avatars)
- `PATCH /api/v1/settings/navbar` — `{ "links": [{ "label": "Shop", "url": "/shop", "children": [...] }], "groups": { "public": [...], "auth": [...], "customer": [...], "admin": [...] } }`
- `PATCH /api/v1/settings/footer` — `{ "description": "...", "columns": [{ "title": "...", "links": [...] }], "socialLinks": [...], "copyrightText": "...", "newsletter": { "enabled": true, "heading": "..." } }`
- `PATCH /api/v1/settings/contact` — `{ "address": "...", "phone": "...", "email": "...", "hours": "...", "mapEmbedUrl": "...", "social": { "twitter": "...", "instagram": "...", "facebook": "..." } }`
- `PATCH /api/v1/settings/about` — `{ "story": "...", "mission": "...", "stats": [{ "label": "...", "value": "..." }] }` (+ `images[0]` for the about image)
- `PATCH /api/v1/settings/limitedOffer` — `{ "enabled": true, "badge": "...", "title": "...", "subtitle": "...", "ctaText": "...", "ctaLink": "...", "endsAt": "..." }` (+ `images[0]` for the offer image)

### PATCH /api/v1/settings/preset/:niche (Apply Niche Preset — Admin)
**Request:**
```
PATCH /api/v1/settings/preset/clothing
Authorization: Bearer <admin_token>
```
Applies brand + hero + about + contact + footer from the preset in one write. Valid niches: `clothing`, `perfume_oil`, `eyewear`. Unknown → 400.

## Seeding
Run once after DB provisioning (or in CI/CD before first deploy):
```bash
npm run seed:settings
```
This creates the singleton document prefilled from the `DEFAULT_NICHE` preset (`perfume_oil`) if it does not exist; if it already exists it skips.

## Notes
- `GET /settings` is **public**; all writes (`PATCH /`, `PATCH /:section`, `PATCH /preset/:niche`) require the `admin` role via the `auth` middleware.
- The in-memory cache is invalidated on every write. For multi-instance deployments, swap `settings.cache.ts` for Redis (or add a TTL).
- Sections are typed sub-schemas (`{ _id: false }`) — no generic `content` blob. Adding a new config area means adding a new typed sub-schema + a `SETTINGS_SECTIONS` entry + a zod schema.
- **Logo syncing**: the logo lives once under `brand`. Navbar/footer intentionally have no logo field — the frontend reads `brand.logo`.
