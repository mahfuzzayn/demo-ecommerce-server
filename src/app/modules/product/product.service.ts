import { IProduct } from "./product.interface";
import Product from "./product.model";
import Category from "../category/category.model";
import Brand from "../brand/brand.model";
import AppError from "../../errors/appError";
import { StatusCodes } from "http-status-codes";
import { ProductSearchableFields } from "./product.constant";
import QueryBuilder from "../../builder/QueryBuilder";
import { IImageFile } from "../../interface/IImageFile";

const getAllProducts = async (query: Record<string, unknown>) => {
    const productQuery = new QueryBuilder(
        Product.find({ isActive: true })
            .populate("category", "name slug")
            .populate("brand", "name logo"),
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

    const result = await productQuery.modelQuery;
    const meta = await productQuery.countTotal();
    return {
        result,
        meta,
    };
};

const getSingleProduct = async (productId: string) => {
    const product = await Product.findById(productId)
        .populate("category", "name slug")
        .populate("brand", "name logo");

    if (!product) {
        throw new AppError(StatusCodes.NOT_FOUND, "Product not found!");
    }
    if (!product.isActive) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Product is not available!");
    }
    return product;
};

const createProduct = async (
    payload: IProduct,
    files?: IImageFile[],
) => {
    // Validate category exists
    await Category.checkCategoryExist(payload.category.toString());

    // Validate brand exists
    await Brand.checkBrandExist(payload.brand.toString());

    // Check if slug is unique
    const slug = payload.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const isSlugUnique = await Product.isSlugUnique(slug);
    if (!isSlugUnique) {
        throw new AppError(
            StatusCodes.CONFLICT,
            "A product with a similar name already exists!",
        );
    }

    // Handle uploaded images
    if (files && files.length > 0) {
        payload.imageUrls = files.map((file) => file.path);
    }

    const product = new Product(payload);
    const createdProduct = await product.save();

    // Populate references before returning
    const populatedProduct = await Product.findById(createdProduct._id)
        .populate("category", "name slug")
        .populate("brand", "name logo");

    return populatedProduct;
};

const updateProduct = async (
    productId: string,
    payload: Partial<IProduct>,
    files?: IImageFile[],
) => {
    await Product.checkProductExist(productId);

    // Validate category if being updated
    if (payload.category) {
        await Category.checkCategoryExist(payload.category.toString());
    }

    // Validate brand if being updated
    if (payload.brand) {
        await Brand.checkBrandExist(payload.brand.toString());
    }

    // If name is being updated, generate new slug
    if (payload.name) {
        const newSlug = payload.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const isSlugUnique = await Product.isSlugUnique(newSlug, productId);
        if (!isSlugUnique) {
            throw new AppError(
                StatusCodes.CONFLICT,
                "A product with a similar name already exists!",
            );
        }
    }

    // Handle uploaded images - replace existing ones
    if (files && files.length > 0) {
        payload.imageUrls = files.map((file) => file.path);
    }

    const result = await Product.findByIdAndUpdate(productId, payload, {
        new: true,
    })
        .populate("category", "name slug")
        .populate("brand", "name logo");

    return result;
};

const deleteProduct = async (productId: string) => {
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError(StatusCodes.NOT_FOUND, "Product not found!");
    }

    product.isActive = false;
    const deletedProduct = await product.save();
    return deletedProduct;
};

export const ProductServices = {
    getAllProducts,
    getSingleProduct,
    createProduct,
    updateProduct,
    deleteProduct,
};
