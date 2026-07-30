import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import QueryBuilder from "../../builder/QueryBuilder";
import { ICoupon } from "./coupon.interface";
import Coupon from "./coupon.model";
import { CouponSearchableFields } from "./coupon.constant";

const getAllCoupons = async (query: Record<string, unknown>) => {
    const couponQuery = new QueryBuilder(
        Coupon.find({ isDeleted: { $ne: true } }),
        query,
    )
        .search(CouponSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await couponQuery.modelQuery;
    const meta = await couponQuery.countTotal();

    return { result, meta };
};

const getCouponByCode = async (couponCode: string) => {
    const coupon = await Coupon.findOne({
        code: { $regex: new RegExp(`^${couponCode}$`, "i") },
        isDeleted: { $ne: true },
    });

    if (!coupon) {
        throw new AppError(StatusCodes.NOT_FOUND, "Coupon not found!");
    }

    // Check if coupon is within valid date range
    const now = new Date();
    if (now < coupon.startDate) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Coupon is not yet active!");
    }
    if (now > coupon.endDate) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Coupon has expired!");
    }
    if (!coupon.isActive) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Coupon is not active!");
    }

    return coupon;
};

const createCoupon = async (payload: ICoupon) => {
    const isUnique = await Coupon.isCouponCodeUnique(payload.code);
    if (!isUnique) {
        throw new AppError(
            StatusCodes.CONFLICT,
            "Coupon with this code already exists!",
        );
    }

    // Convert date strings to Date objects
    payload.startDate = new Date(payload.startDate);
    payload.endDate = new Date(payload.endDate);

    if (payload.startDate >= payload.endDate) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "End date must be after start date!",
        );
    }

    // Ensure code is uppercase
    payload.code = payload.code.toUpperCase();

    const coupon = await Coupon.create(payload);
    return coupon;
};

const updateCoupon = async (
    couponCode: string,
    payload: Partial<ICoupon>,
) => {
    const coupon = await Coupon.findOne({
        code: { $regex: new RegExp(`^${couponCode}$`, "i") },
        isDeleted: { $ne: true },
    });

    if (!coupon) {
        throw new AppError(StatusCodes.NOT_FOUND, "Coupon not found!");
    }

    if (payload.code) {
        const isUnique = await Coupon.isCouponCodeUnique(
            payload.code,
            coupon._id.toString(),
        );
        if (!isUnique) {
            throw new AppError(
                StatusCodes.CONFLICT,
                "Coupon with this code already exists!",
            );
        }
        payload.code = payload.code.toUpperCase();
    }

    if (payload.startDate) payload.startDate = new Date(payload.startDate);
    if (payload.endDate) payload.endDate = new Date(payload.endDate);

    const result = await Coupon.findByIdAndUpdate(coupon._id, payload, {
        new: true,
    });

    return result;
};

const deleteCoupon = async (couponId: string) => {
    const coupon = await Coupon.checkCouponExist(couponId);

    coupon.isDeleted = true;
    coupon.isActive = false;
    await coupon.save();

    return coupon;
};

export const CouponServices = {
    getAllCoupons,
    getCouponByCode,
    createCoupon,
    updateCoupon,
    deleteCoupon,
};
