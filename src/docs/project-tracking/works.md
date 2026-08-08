Started at: 07/08/2026
Updated at: 07/08/2026
Ended at: N/A

Rules
1. Follow code standards of this project and code quality should be readable, maintainable.
2. Use codebase-memory-mcp server to read files, look for modules, don't use traditional file reading which consumes tokens.
3. Maintain edge-cases, code quality, readability, and reusability.
4. Follow the top 3 rules strictly.

# Work 1
## Modules Update (Now)

### Order Module
1. Model update: add phoneNo., recipientName, notes (optional) but can be filled by Admin or User when ordering as notes and it should be mandatory, orderId, create a util function, format: 'DE DD D MM M 0001 U/G' (Remove space, e.g. DE07D08M0001U) U means user G means Guest, when order will be created it will be inserted.
2. When creating order we want the auth middleware to be optional, so either remove it otherwise we would need internal middleware change, so there won't be no auth middleware.
So the flow take orders from anyone if there is no user the the user property will be null, and if there is user it will use jwt decode verify then create the order.
3. New route GET /track-order/{orderId}, will returned detailed tracking insights of the product, design the response i will later verify.
4. GET Route /:orderId/invoice, will return detailed order invoice data as json that frontend will use to render using react pdf renderer and download button, make sure it verifies if the order is paid or not.

### Activities (New Module)
Create a new model named activities
Goal is store all necessary modules activities tracking, such as Order, Brands, Categories, Product, Reviews, User, Settings.
Run and death type write operation in database, no need to use transaction as write more then two will happen and it will be mostly used in most module service functions.

Routes
getAllActivities GET use QueryBuilder, pagination
getSingleActivity GET
No delete needed.
clearSingleActivity / PATCH removes 1 single activity
clearActivities / PATCH use body as delete all or range wise from these to that date, 2 options
Create necessary module files with readme and add contents

### Lastly
Finalize the modules, check all edge cases, trade offs, and update the backend-usage-guide.md that frontend will re-read and understand to update the frontend.

---

# Work 1 — Completion (Executed ✔)
*Executed on 07/08/2026 per the rules above. Typecheck (`npx tsc --noEmit`) passes clean.*

## Order Module (Done)
1. **Model/interface update** — added `orderId` (unique), `recipientName`, `phoneNo`, `notes` (optional), and made `user` nullable (`null` for guests). All four recipient fields are validated (recipientName/phoneNo required on create; notes optional; all updatable).
2. **Order ID util** — `src/app/utils/generateOrderId.ts` generates `DE{DD}D{MM}M{0001}{U|G}` (e.g. `DE07D08M0001U`). Sequence increments per day from existing orders with the same prefix; a retry loop guards concurrent collisions; unique index on `orderId`.
3. **Optional auth (guest checkout)** — new `src/app/middleware/optionalAuth.ts`: no token → pass through as guest; valid token → verify + attach user; invalid/expired token → still rejected (a client sending a bad token isn't silently treated as a guest). `POST /order` uses it; guests get `user: null` and a `G` orderId suffix.
4. **`GET /order/track-order/:orderId`** (public) — returns order overview, per-product details (name/image/qty/unitPrice/total), payment info, recipient info, and a `statusHistory` timeline. Looks up by `orderId` or Mongo `_id`.
5. **`GET /order/:orderId/invoice`** (admin/owner) — returns invoice JSON (customer/recipient/payment/items/totals) for react-pdf. **400 unless `paymentStatus === "Paid"`**.
6. Ownership guards updated for guest orders: `getOrderDetails`/`updateOrder` allow admin always, owner only when the order has a user; guest orders are admin-only.

## Activity Module (New — Done)
- New module under `src/app/modules/activity/`: `activity.interface.ts` (module/type enums), `activity.model.ts` (timestamps, newest-first sort), `activity.service.ts` (list/single/clear-single/clear + shared `logActivity` helper), `activity.validation.ts` (clear body refine), `activity.controller.ts`, `activity.routes.ts`, `activity.constant.ts`, `activity.readme.md`.
- Routes (all admin): `GET /activity` (QueryBuilder + pagination), `GET /activity/:activityId`, `PATCH /activity/:activityId/clear` (remove one), `PATCH /activity/clear` (body `{ clearAll: true }` OR `{ from, to }` date range; empty body → 400). No delete route.
- Wired `logActivity` into the service layer of: **Order** (create/update/status), **Brand** (create/update/delete), **Category** (create/update/delete), **Product** (create/update/delete), **Review** (create/flag/delete), **User** (register/profile/status), **Coupon** (create/update/delete), **Settings** (section update/brand/preset), **Payment** (stripe/ssl/bkash paid). Fire-and-forget after the main write — no transaction, as specified.

## Edge cases & trade-offs
- Guest orders are admin-only for detail/update (no owner) — documented.
- `clearActivities` refuses an empty body so the log can't be wiped accidentally.
- Invalid dates in the range → 400; `from`/`to` are inclusive on `createdAt`.
- orderId collisions handled via unique index + retry; fallback to a timestamp suffix is the last resort.
- Activity writes are not transactional (intentional) — the primary write is never rolled back because of a log failure.

## Docs updated
- `backend-usage-guide.md` — Order section rewritten (guest checkout, orderId, recipient fields, track-order + invoice routes), new **§16 Activity Module**, appendix expanded to **61 endpoints** (Order 9, Activity 4).
- `order.readme.md` — rewritten with the new fields, routes, and guest-checkout flow.
- `activity.readme.md` — created with full request/response examples.
- `progress.md` — Order routes 6→9, Activity module added (4 routes), totals 54→61, header updated.
- `works.md` — this completion record.


## Work 2 (Line 89 Starting) (Completed)
### Settings Module update
1. Brand section will have currency "usd", "bdt", "aud", "gbp", "euro", as value and label. When creating product it won't take manual currency it will inherit from brand currency data, similarly when creating order it will look from product currency and inherit that not from brand.
Then deliveryOptions in brand section
deliveryOptions: [
  {
    name: string;       // "Store Pickup", "Inside Dhaka", "Outside Dhaka", "International"
    charge: number;     // 0, 90, 150, 15
    country?: string;   // "BD" or omit = worldwide/default
    isActive: boolean;
  }
]
e.g.
[
  { name: "Store Pickup", charge: 0 },
  { name: "Inside Dhaka", charge: 90, country: "BD" },
  { name: "Outside Dhaka", charge: 150, country: "BD" },
  { name: "International", charge: 15 }, // no country = fallback for everyone else
]

Then update in order creating user can't select the deliveryCharge amount instead he will use deliveryOptionName field = "Inside Dhaka" and then backend in order creation verify with brand delivery options and get the exact value then internally set the deliveryCharge.

By doing this the whole store will use at a time one currency, but can change if needed + delivery options can be modified.

### Product Module Update
we need offerPrice for product, so admin can update or modify offer and maintain for each products

// I have given you a sample, think and decide then make, if changes needed apply according to our writing style of code.
// product.model.ts
const offerPriceSchema = new Schema({
  type: { type: String, enum: ["flat", "percentage"], required: true },
  value: { type: Number, required: true, min: 0 },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, { _id: false });

// add to productSchema:
offerPrice: { type: offerPriceSchema, default: null }

Then Variants for product so a product can have a single variant (by default) or multi variant by sizes, colors etc.

// product.model.ts
const productVariantSchema = new Schema({
  sku: { type: String, required: true, unique: true },
  attributes: { type: Map, of: String, required: true },
  price: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  imageUrls: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
}, { _id: false });

// add to productSchema:
colorOptions: { type: [{ name: String, hex: String }], default: [] },
variants: { type: [productVariantSchema], default: [] },
hasVariants: { type: Boolean, default: false },

The sku will be like this: {PRODUCT_PREFIX}-{COLOR}-{SIZE}-{RANDOM}, made on backend.

Then Product Image updating feature needs improvement user can keep and update images or re order what to keep first and last, currently it replaces, and no order of photos to manage.

// product.interface.ts
export interface IProductImage {
  publicId: string;   // cloudinary public_id, needed to delete specific ones
  url: string;
  order: number;       // for reordering, 0 = first/cover image
}
imageUrls: { type: [{ publicId: String, url: String, order: Number }], default: [] },
// request body
{
  keepImages: [{ publicId: "abc", order: 0 }, { publicId: "def", order: 1 }], // existing, reordered
  newImages: [File, File],           // to upload
  removedImageIds: ["ghi", "jkl"],   // to delete from cloudinary
}
// These are to brainstorm, now think and decide according to our building style and update the system.

### User Module
User profile photoUrl needs a removal process, let user send photoUrl: "", it will accept it and make the photoUrl property null




# Payment Issue (New)
SSLCommerz not initializing payments, looks like they have updated from v3 to v4, need to research first.

## Works 3

### Updates

1. Settings Brand Theme: currency is single item as "usd" or "bdt" etc. (Done)
2. Product create/update update, size, color wise