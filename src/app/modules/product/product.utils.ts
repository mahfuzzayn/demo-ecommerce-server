import Product from "./product.model";
import Settings from "../settings/settings.model";
import { SETTINGS_ID } from "../settings/settings.constant";
import AppError from "../../errors/appError";
import { StatusCodes } from "http-status-codes";
import { generateSlug } from "../../utils/generateSlug";

// The store's active currency — brand.currency in the settings singleton.
// Products inherit this on create (no manual currency).
export const getStoreCurrency = async (): Promise<string> => {
    const settings = await Settings.findById(SETTINGS_ID).select("brand");
    return settings?.brand?.currency || "usd";
};

// Build a variant SKU: {PRODUCT_PREFIX}-{COLOR}-{SIZE}-{RANDOM}
// e.g. PRD-BLACK-M-7F3K9Q — attributes are uppercased/cleaned, random 6-char suffix.
export const buildVariantSku = (
    productPrefix: string,
    attributes: Record<string, string>,
): string => {
    const clean = (s: string) =>
        s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "NA";
    const parts = Object.values(attributes).map(clean);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return [productPrefix, ...parts, random].join("-");
};

// Normalize a variant's imageUrls to { publicId, url, order } objects —
// the same shape as the main product images. Accepts:
//   - existing objects { publicId, url, order }
//   - plain URL strings (treated as new images with no publicId)
// Missing order is assigned sequentially; missing url is backfilled from
// the existing images by publicId (update path, when only publicId is sent).
export const normalizeVariantImages = (
    imageUrls: any[],
    existingImages: any[] = [],
): { publicId: string; url: string; order: number }[] => {
    const existingByPublicId = new Map(
        existingImages.map((img: any) => [img.publicId, img]),
    );

    return (imageUrls || []).map((img, i) => {
        if (typeof img === "string") {
            return { publicId: "", url: img, order: i };
        }
        const publicId = img?.publicId || "";
        return {
            publicId,
            url: img?.url || existingByPublicId.get(publicId)?.url || "",
            order: typeof img?.order === "number" ? img.order : i,
        };
    });
};

// Populate reviews (optionally only non-flagged ones) + base refs
export const populateProductRefs = (query: any, nonFlaggedOnly = false) => {
    query
        .populate("category", "name slug")
        .populate("brand", "name logo")
        .populate({
            path: "reviews",
            match: nonFlaggedOnly ? { isFlagged: false } : {},
            select: "rating description isFlagged createdAt",
        });

    return query;
};

// Build the base slug for a product name (used when no slug is provided)
const buildBaseSlug = (name: string): string =>
    name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

// Resolve the final slug for create/update:
// - If a slug is provided, it must not belong to a DIFFERENT product name.
//   A slug matching a product with the SAME name is allowed (same product, different variant/price).
// - If no slug is provided, generate a base slug (or random-suffixed one) that is unique.
export const resolveProductSlug = async (
    name: string,
    slug?: string,
    excludeId?: string,
): Promise<string> => {
    if (slug) {
        const existing = await Product.findOne({ slug }).select("name _id");
        if (existing && String(existing._id) !== excludeId) {
            if (existing.name.toLowerCase() !== name.toLowerCase()) {
                throw new AppError(
                    StatusCodes.CONFLICT,
                    "A product with this slug already exists!",
                );
            }
        }
        return slug;
    }

    const baseSlug = buildBaseSlug(name);
    if (!baseSlug) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Product name must contain at least one letter or number to generate a slug",
        );
    }

    const isBaseSlugUnique = await Product.isSlugUnique(baseSlug, excludeId);
    if (isBaseSlugUnique) {
        return baseSlug;
    }

    // Base slug is taken by a DIFFERENT product name — append a random suffix
    return generateSlug(name);
};
