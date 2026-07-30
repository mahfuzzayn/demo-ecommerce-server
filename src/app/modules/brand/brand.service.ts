import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import QueryBuilder from "../../builder/QueryBuilder";
import { IBrand } from "./brand.interface";
import Brand from "./brand.model";
import { BrandSearchableFields } from "./brand.constant";
import { IJwtPayload } from "../auth/auth.interface";
import { IImageFile } from "../../interface/IImageFile";

const getAllBrands = async (query: Record<string, unknown>) => {
    const brandQuery = new QueryBuilder(Brand.find({ isActive: true }), query)
        .search(BrandSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await brandQuery.modelQuery.populate("createdBy", "name email");
    const meta = await brandQuery.countTotal();

    return { result, meta };
};

const createBrand = async (
    payload: IBrand,
    authUser: IJwtPayload,
    file?: IImageFile,
) => {
    const isUnique = await Brand.isBrandNameUnique(payload.name);
    if (!isUnique) {
        throw new AppError(StatusCodes.CONFLICT, "Brand with this name already exists!");
    }

    payload.createdBy = authUser.userId as any;

    if (file?.path) {
        payload.logo = file.path;
    }

    const brand = await Brand.create(payload);
    return brand;
};

const updateBrand = async (
    brandId: string,
    payload: Partial<IBrand>,
    file?: IImageFile,
) => {
    await Brand.checkBrandExist(brandId);

    if (payload.name) {
        const isUnique = await Brand.isBrandNameUnique(payload.name, brandId);
        if (!isUnique) {
            throw new AppError(StatusCodes.CONFLICT, "Brand with this name already exists!");
        }
    }

    if (file?.path) {
        payload.logo = file.path;
    }

    const result = await Brand.findByIdAndUpdate(brandId, payload, {
        new: true,
    });

    return result;
};

const deleteBrand = async (brandId: string) => {
    const brand = await Brand.checkBrandExist(brandId);

    brand.isActive = false;
    await brand.save();

    return brand;
};

export const BrandServices = {
    getAllBrands,
    createBrand,
    updateBrand,
    deleteBrand,
};
