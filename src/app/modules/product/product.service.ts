import { IProduct } from "./product.interface";
import Product from "./product.model";
import Category from "../category/category.model";
import Brand from "../brand/brand.model";
import { cloudinaryUpload } from "../../config/cloudinary.config";
import AppError from "../../errors/appError";
import { StatusCodes } from "http-status-codes";
import { ProductSearchableFields } from "./product.constant";
import QueryBuilder from "../../builder/QueryBuilder";
import { IImageFile } from "../../interface/IImageFile";
import { IJwtPayload } from "../auth/auth.interface";
import { ActivityServices } from "../activity/activity.service";
import { ActivityModule, ActivityType } from "../activity/activity.interface";
import {
    getStoreCurrency,
    buildVariantSku,
    populateProductRefs,
    resolveProductSlug,
    normalizeVariantImages,
} from "./product.utils";

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

    // Currency is inherited from the store's brand settings — no manual currency.
    payload.currency = (await getStoreCurrency()) as IProduct["currency"];

    // Normalize offer price dates to Date objects
    if (payload.offerPrice) {
        payload.offerPrice.startAt = new Date(payload.offerPrice.startAt);
        payload.offerPrice.endAt = new Date(payload.offerPrice.endAt);
        if (payload.offerPrice.endAt <= payload.offerPrice.startAt) {
            throw new AppError(
                StatusCodes.BAD_REQUEST,
                "Offer end date must be after start date!",
            );
        }
    }

    // Generate SKUs for variants without one
    const productPrefix = payload.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 4) || "PRD";
    if (payload.variants?.length) {
        payload.hasVariants = true;
        payload.variants = payload.variants.map((variant) => ({
            ...variant,
            sku:
                variant.sku ||
                buildVariantSku(productPrefix, variant.attributes || {}),
            imageUrls: normalizeVariantImages(variant.imageUrls as any[]),
        }));
    }

    // Handle uploaded images → { publicId, url, order } objects
    if (files && files.length > 0) {
        payload.imageUrls = files.map((file, i) => ({
            publicId: file.filename || "",
            url: file.path,
            order: i,
        }));
    }

    const product = new Product(payload);
    const createdProduct = await product.save();

    await ActivityServices.logActivity({
        module: ActivityModule.PRODUCT,
        type: ActivityType.CREATE,
        message: `Product "${createdProduct.name}" was created`,
        referenceId: createdProduct._id.toString(),
        performedBy: authUser.userId,
        metadata: { price: createdProduct.price, currency: createdProduct.currency },
    });

    // Populate references before returning
    const populatedProduct = await populateProductRefs(
        Product.findById(createdProduct._id),
    );

    return populatedProduct;
};

const updateProduct = async (
    productId: string,
    payload: Partial<IProduct> & {
        keepImages?: { publicId: string; url?: string; order: number }[];
        removedImageIds?: string[];
    },
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

    // Normalize offer price dates
    if (payload.offerPrice) {
        payload.offerPrice.startAt = new Date(payload.offerPrice.startAt);
        payload.offerPrice.endAt = new Date(payload.offerPrice.endAt);
        if (payload.offerPrice.endAt <= payload.offerPrice.startAt) {
            throw new AppError(
                StatusCodes.BAD_REQUEST,
                "Offer end date must be after start date!",
            );
        }
    }

    // Generate SKUs for variants without one (keeps existing skus untouched)
    // and normalize each variant's imageUrls against the existing variant
    // images (backfills url by publicId; assigns sequential order).
    if (payload.variants?.length) {
        const productPrefix = (existingProduct.name || "PRD")
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 4) || "PRD";
        const existingVariants = (existingProduct.variants as any[]) || [];
        payload.variants = payload.variants.map((variant) => {
            const existingVariant = existingVariants.find(
                (v: any) => v.sku === variant.sku,
            );
            return {
                ...variant,
                sku:
                    variant.sku ||
                    buildVariantSku(productPrefix, variant.attributes || {}),
                imageUrls: normalizeVariantImages(
                    variant.imageUrls as any[],
                    existingVariant?.imageUrls || [],
                ),
            };
        });
    }

    // -----------------------------------------------------------------
    // Image management — combine keepImages + newly uploaded files, delete
    // removed ones from Cloudinary, and re-order everything.
    // -----------------------------------------------------------------
    const removedIds = payload.removedImageIds || [];

    // Preserve existing URLs when keepImages only provide publicId+order.
    const existingImages = (existingProduct.imageUrls as any[]) || [];
    const imageByPublicId = new Map(
        existingImages.map((img) => [img.publicId, img]),
    );

    const keepImages = (payload.keepImages || []).map((img) => ({
        publicId: img.publicId,
        url: img.url || imageByPublicId.get(img.publicId)?.url || "",
        order: img.order,
    }));

    // New uploads continue after the kept images' max order.
    let nextOrder = keepImages.length
        ? Math.max(...keepImages.map((img) => img.order)) + 1
        : 0;
    const newImages = (files || []).map((file) => ({
        publicId: file.filename || "",
        url: file.path,
        order: nextOrder++,
    }));

    const mergedImages = [...keepImages, ...newImages];

    // Delete removed images from Cloudinary (best-effort — a missing image
    // shouldn't fail the whole update).
    if (removedIds.length) {
        await Promise.all(
            removedIds.map((id) =>
                cloudinaryUpload.uploader
                    .destroy(id)
                    .catch(() => undefined),
            ),
        );
    }

    // Only touch imageUrls when the caller actually manages images; a plain
    // imageUrls field in data is ignored so it can't silently wipe the set.
    if (payload.keepImages?.length || files?.length || removedIds.length) {
        payload.imageUrls = mergedImages as any;
    } else {
        delete (payload as any).imageUrls;
        delete (payload as any).keepImages;
        delete (payload as any).removedImageIds;
    }

    const result = await populateProductRefs(
        Product.findByIdAndUpdate(productId, payload, {
            new: true,
        }),
    );

    await ActivityServices.logActivity({
        module: ActivityModule.PRODUCT,
        type: ActivityType.UPDATE,
        message: `Product "${result?.name}" was updated`,
        referenceId: productId,
        metadata: {
            imagesKept: keepImages.length,
            imagesAdded: newImages.length,
            imagesRemoved: removedIds.length,
        },
    });

    return result;
};

const deleteProduct = async (productId: string) => {
    const product = await Product.checkProductExist(productId);

    product.isDeleted = true;
    product.isActive = false;
    await product.save();

    await ActivityServices.logActivity({
        module: ActivityModule.PRODUCT,
        type: ActivityType.DELETE,
        message: `Product "${product.name}" was deleted`,
        referenceId: product._id.toString(),
    });

    return product;
};

export const ProductServices = {
    getAllProducts,
    getSingleProduct,
    createProduct,
    updateProduct,
    deleteProduct,
};
