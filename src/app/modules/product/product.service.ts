import { IProduct } from "./product.interface";
import Product from "./product.model";
import Category from "../category/category.model";
import Brand from "../brand/brand.model";
import AppError from "../../errors/appError";
import { StatusCodes } from "http-status-codes";
import { ProductSearchableFields } from "./product.constant";
import QueryBuilder from "../../builder/QueryBuilder";
import { IImageFile } from "../../interface/IImageFile";
import { generateSlug } from "../../utils/generateSlug";
import { IJwtPayload } from "../auth/auth.interface";

// Populate reviews (optionally only non-flagged ones) + base refs
const populateProductRefs = (query: any, nonFlaggedOnly = false) => {
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
const resolveProductSlug = async (
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

const getAllProducts = async (query: Record<string, unknown>) => {
    const productQuery = new QueryBuilder(
        Product.find({ isDeleted: false }),
        query,
    )
        .search(ProductSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();

    // Apply price range filter if provided
    if (query.minPrice || query.maxPrice) {
        const minPrice = Number(query.minPrice) || 0;
        const maxPrice = Number(query.maxPrice) || Number.MAX_SAFE_INTEGER;
        productQuery.priceRange(minPrice, maxPrice);
    }

    const result = await populateProductRefs(
        productQuery.modelQuery,
        true,
    ).exec();
    const meta = await productQuery.countTotal();
    return {
        result,
        meta,
    };
};

const getSingleProduct = async (productId: string) => {
    const product = await populateProductRefs(
        Product.findOne({
            _id: productId,
            isDeleted: false,
        }),
        true,
    );

    if (!product) {
        throw new AppError(StatusCodes.NOT_FOUND, "Product not found!");
    }

    return product;
};

const createProduct = async (
    payload: IProduct,
    authUser: IJwtPayload,
    files?: IImageFile[],
) => {
    // Validate category exists
    await Category.checkCategoryExist(payload.category.toString());

    // Validate brand exists
    await Brand.checkBrandExist(payload.brand.toString());

    // Attach the creator (admin) to the product
    payload.createdBy = authUser.userId as any;

    // Resolve slug (provided or auto-generated unique)
    payload.slug = await resolveProductSlug(payload.name, payload.slug);

    // Handle uploaded images
    if (files && files.length > 0) {
        payload.imageUrls = files.map((file) => file.path);
    }

    const product = new Product(payload);
    const createdProduct = await product.save();

    // Populate references before returning
    const populatedProduct = await populateProductRefs(
        Product.findById(createdProduct._id),
    );

    return populatedProduct;
};

const updateProduct = async (
    productId: string,
    payload: Partial<IProduct>,
    files?: IImageFile[],
) => {
    const existingProduct = await Product.checkProductExist(productId);

    // Validate category if being updated
    if (payload.category) {
        await Category.checkCategoryExist(payload.category.toString());
    }

    // Validate brand if being updated
    if (payload.brand) {
        await Brand.checkBrandExist(payload.brand.toString());
    }

    // Resolve slug when name or slug is being updated
    if (payload.name || payload.slug) {
        payload.slug = await resolveProductSlug(
            (payload.name || existingProduct.name) as string,
            payload.slug,
            productId,
        );
    }

    // Handle uploaded images - replace existing ones
    if (files && files.length > 0) {
        payload.imageUrls = files.map((file) => file.path);
    }

    const result = await populateProductRefs(
        Product.findByIdAndUpdate(productId, payload, {
            new: true,
        }),
    );

    return result;
};

const deleteProduct = async (productId: string) => {
    const product = await Product.checkProductExist(productId);

    product.isDeleted = true;
    product.isActive = false;
    await product.save();

    return product;
};

export const ProductServices = {
    getAllProducts,
    getSingleProduct,
    createProduct,
    updateProduct,
    deleteProduct,
};
