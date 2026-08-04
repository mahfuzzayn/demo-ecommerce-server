import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import QueryBuilder from "../../builder/QueryBuilder";
import { ICategory } from "./category.interface";
import Category from "./category.model";
import { CategorySearchableFields } from "./category.constant";
import { IJwtPayload } from "../auth/auth.interface";
import { IImageFile } from "../../interface/IImageFile";
import { generateSlug } from "../../utils/generateSlug";

const getAllCategories = async (query: Record<string, unknown>) => {
    const categoryQuery = new QueryBuilder(
        Category.find({ isDeleted: false }).populate("parent", "name slug"),
        query,
    )
        .search(CategorySearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await categoryQuery.modelQuery.populate(
        "createdBy",
        "name email",
    );
    const meta = await categoryQuery.countTotal();

    return { result, meta };
};

const getSingleCategory = async (categoryId: string) => {
    const category = await Category.findOne({
        _id: categoryId,
        isDeleted: false,
    }).populate("parent", "name slug");

    if (!category) {
        throw new AppError(StatusCodes.NOT_FOUND, "Category does not exist!");
    }

    return category;
};

const createCategory = async (
    payload: ICategory,
    authUser: IJwtPayload,
    file?: IImageFile,
) => {
    const isUnique = await Category.isCategoryNameUnique(payload.name);
    if (!isUnique) {
        throw new AppError(
            StatusCodes.CONFLICT,
            "Category with this name already exists!",
        );
    }

    payload.createdBy = authUser.userId as any;

    if (file?.path) {
        payload.icon = file.path;
    }

    // Validate parent if provided
    if (payload.parent) {
        await Category.checkCategoryExist(payload.parent.toString());
    }

    // Auto-generate a unique slug from the name if not provided
    if (!payload.slug) {
        const baseSlug = payload.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        const isBaseSlugUnique = await Category.isSlugUnique(baseSlug);
        payload.slug = isBaseSlugUnique
            ? baseSlug
            : generateSlug(payload.name);
    } else {
        const isSlugUnique = await Category.isSlugUnique(payload.slug);
        if (!isSlugUnique) {
            throw new AppError(
                StatusCodes.CONFLICT,
                "Category with this slug already exists!",
            );
        }
    }

    const category = await Category.create(payload);
    return category;
};

const updateCategory = async (
    categoryId: string,
    payload: Partial<ICategory>,
    file?: IImageFile,
) => {
    await Category.checkCategoryExist(categoryId);

    if (payload.name) {
        const isUnique = await Category.isCategoryNameUnique(
            payload.name,
            categoryId,
        );
        if (!isUnique) {
            throw new AppError(
                StatusCodes.CONFLICT,
                "Category with this name already exists!",
            );
        }
    }

    if (payload.slug) {
        const isSlugUnique = await Category.isSlugUnique(
            payload.slug,
            categoryId,
        );
        if (!isSlugUnique) {
            throw new AppError(
                StatusCodes.CONFLICT,
                "Category with this slug already exists!",
            );
        }
    }

    if (file?.path) {
        payload.icon = file.path;
    }

    // Validate parent if provided
    if (payload.parent) {
        await Category.checkCategoryExist(payload.parent.toString());
    }

    const result = await Category.findByIdAndUpdate(categoryId, payload, {
        new: true,
    }).populate("parent", "name slug");

    return result;
};

const deleteCategory = async (categoryId: string) => {
    const category = await Category.checkCategoryExist(categoryId);

    // Check if category has child categories
    const hasChildren = await Category.findOne({ parent: categoryId });
    if (hasChildren) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Cannot delete category with subcategories. Remove child categories first.",
        );
    }

    category.isDeleted = true;
    category.isActive = false;
    await category.save();

    return category;
};

export const CategoryServices = {
    getAllCategories,
    getSingleCategory,
    createCategory,
    updateCategory,
    deleteCategory,
};
