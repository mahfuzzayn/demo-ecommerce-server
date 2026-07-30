import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import QueryBuilder from "../../builder/QueryBuilder";
import { ICategory } from "./category.interface";
import Category from "./category.model";
import { CategorySearchableFields } from "./category.constant";
import { IJwtPayload } from "../auth/auth.interface";
import { IImageFile } from "../../interface/IImageFile";

const getAllCategories = async (query: Record<string, unknown>) => {
    const categoryQuery = new QueryBuilder(
        Category.find({ isActive: true }).populate("parent", "name slug"),
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

    category.isActive = false;
    await category.save();

    return category;
};

export const CategoryServices = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
