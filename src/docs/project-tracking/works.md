Started at: 14/08/2026
Updated at: 14/08/2026
Ended at: N/A

# Rules
1. Follow code standards of this project and code quality should be readable, maintainable.
2. Use codebase-memory-mcp server to read files, look for modules, functions, context and don't use traditional file reading which consumes tokens.
3. Maintain edge-cases, code quality, readability, and reusability.
4. Follow the top 3 rules strictly.

## Work 1

### User Module (Completed)
User profile photoUrl needs a removal process, let user send photoUrl: "", it will accept it and make the photoUrl property null

### Updates
1. Settings Brand Theme: currency is single item as "usd" or "bdt" etc. (Done)

2. Product create/update update, size, color wise (Ongoing)
3. Update Settings theme preset, default should have all sections filled, keep 10 types of popular niche theme.

### Future Fixes (Later)

#### Payment Issue (New)
SSLCommerz not initializing payments, looks like they have updated from v3 to v4, need to research first.

## Product Module — With / Without Variants (Detailed)

### The bug that started this
Creating a product **without variants** failed with:
```
E11000 duplicate key error collection: demo-ecommerce-server.products
index: variants.sku_1 dup key: { variants.sku: null }
```
**Why:** the variant sub-schema declared `sku: { unique: true }` (no `sparse`). MongoDB's multikey unique index on `variants.sku` indexed a `null` value for every product whose `variants` array was empty. The **second** non-variant product created then collided on that `null` entry. The generic duplicate-key handler turned it into the confusing `"null is already exists"` message.

**Fix:** `sku` is now `unique: true, sparse: true` — sparse indexes skip documents with no sku values (empty `variants`), so non-variant products no longer collide while real SKUs stay unique. The legacy non-sparse `variants.sku_1` index is dropped at server startup (`server.ts` → `migrateProductIndexes()`) and Mongoose rebuilds a sparse one.

### How a product WITHOUT variants works
- The admin sends only the base fields: `name`, `description`, `price`, `stock`, `weight`, `category`, `brand`, plus optional `specification`, `keyFeatures`, `offerPrice`, and the main photos as `images` files.
- No `attributes`, no `variants`, no `hasVariants` needed. The server stores `variants: []` and `hasVariants: false`.
- The product has a single price and a single stock counter — the storefront shows one "Add to cart" with that price.
- Stock is decremented directly on the product when an order is placed.

### How a product WITH variants works
- The admin defines **attribute axes** in `attributes`: `[{ key: "Color", values: ["Black", "White"] }, { key: "Size", values: ["S", "M", "L"] }]`. Axes can be anything — color, size, or custom names. `colorOptions` (`{ name, hex }`) is the display palette for color swatches.
- Each variant is a combo: `{ attributes: { Color: "Black", Size: "M" }, price?, stock, imageUrls, isActive }`.
- `hasVariants` is **auto-set** to `true` whenever `variants` has entries (on both create and update).
- Missing `sku`s are auto-generated as `{PREFIX}-{COLOR}-{SIZE}-{RANDOM}` (e.g. `SMAR-BLACK-M-7F3K9Q`); the random suffix makes collisions practically impossible, and the sparse unique index enforces integrity.
- Each variant can carry its own price (falls back to the product price) and its own stock counter.
- **Validation (new):** every variant's `attributes` keys **and** values must be declared in the axes — otherwise `400` with a clear message. This keeps the system manageable: adding a new color/size/custom axis is a data change, not a schema change.

### Variant images
- Main product photos → `images` multipart field (as before).
- New variant photos → `variantImages` multipart field, flat in variant order (max 60 files).
- Each variant's `imageUrls` in `data` declares its image slots:
  - existing images → `{ publicId, order }` (url backfilled by `publicId` on update);
  - **new slots → empty placeholder `{}` (or `{ order }`)** — filled from the `variantImages` files in order of appearance across all variants.
- Too many files for the declared placeholders → `400` count-mismatch message.

### Cloudinary destroy-on-remove (new)
Removing an image — main **or** variant — now destroys the Cloudinary file, not just drops it from the array:
- **Main images:** an existing `publicId` that is **not** in `keepImages` and **not** re-uploaded is destroyed automatically (explicit `removedImageIds` still works too).
- **Variant images:** a stored variant `publicId` absent from the new `imageUrls` is destroyed automatically.
- Shared helper `destroyImagesFromCloudinary(publicIds)` in `product.utils.ts` (best-effort, deduped); the update's activity log now records `imagesRemoved` + `imagesDestroyed`.

### Files changed
- `product.model.ts` — sparse unique sku index.
- `server.ts` — drops legacy `variants.sku_1` index on startup.
- `multer.config.ts` — new `multerUploadFields` helper (multi-field uploads).
- `product.routes.ts` — POST/PATCH use `images` + `variantImages` fields.
- `product.controller.ts` — splits the two file groups.
- `product.service.ts` — create/update: attribute validation, auto `hasVariants`, pool-based variant image merging, destroy-on-remove for main + variant images.
- `product.utils.ts` — `validateVariantAttributes` + `mergeVariantImageFiles` + `destroyImagesFromCloudinary`.
- `product.validation.ts` — image `url` optional (enables `{ publicId, order }` and `{}` placeholders).
- `product.readme.md` — two request types (with/without variants) with file examples + destroy-on-remove notes.

### Order module — offerPrice bug (fixed)
`validateAndPriceProducts` (order.utils.ts) used `product.price` for line totals, ignoring `offerPrice`. Now, when a product has an **active** offer (`isActive !== false`, `startAt <= now <= endAt`), the effective unit price is applied: `flat = price - value`, `percentage = price - (price * value / 100)`, floored at 0. This flows into `totalAmount`, `finalAmount`, coupon `minOrderAmount` checks, and the stored `unitPrice` on the order (so track/invoice reflect it too). Both create and update order re-price through this path.