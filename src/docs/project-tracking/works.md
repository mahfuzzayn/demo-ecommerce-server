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


# Payment Issue (New)
SSLCommerz not initializing payments, looks like they have updated from v3 to v4, need to research first.