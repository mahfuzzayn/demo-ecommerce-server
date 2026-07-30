import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import QueryBuilder from "../../builder/QueryBuilder";
import { IReview } from "./review.interface";
import Review from "./review.model";
import Product from "../product/product.model";
import { ReviewSearchableFields } from "./review.constant";
import { IJwtPayload } from "../auth/auth.interface";

const getAllReviews = async (query: Record<string, unknown>) => {
    const reviewQuery = new QueryBuilder(
        Review.find()
            .populate("user", "name email photoUrl")
            .populate("product", "name slug"),
        query,
    )
        .search(ReviewSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await reviewQuery.modelQuery;
    const meta = await reviewQuery.countTotal();

    return { result, meta };
};

const getSingleReview = async (reviewId: string) => {
    const review = await Review.findById(reviewId)
        .populate("user", "name email photoUrl")
        .populate("product", "name slug");

    if (!review) {
        throw new AppError(StatusCodes.NOT_FOUND, "Review not found!");
    }

    return review;
};

const createReview = async (
    payload: IReview,
    authUser: IJwtPayload,
) => {
    // Check if product exists
    const product = await Product.findById(payload.product);
    if (!product) {
        throw new AppError(StatusCodes.NOT_FOUND, "Product not found!");
    }
    if (!product.isActive) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Product is not available!",
        );
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
        user: authUser.userId,
        product: payload.product,
    });

    if (existingReview) {
        throw new AppError(
            StatusCodes.CONFLICT,
            "You have already reviewed this product!",
        );
    }

    // Attach user to review
    payload.user = authUser.userId as any;

    // Check if user has purchased this product (simplified check)
    // For now, mark as not verified — can be enhanced with order lookup
    payload.isVerifiedPurchase = false;

    const review = await Review.create(payload);

    // Update product average rating
    const ratingStats = await Review.aggregate([
        { $match: { product: review.product } },
        {
            $group: {
                _id: "$product",
                averageRating: { $avg: "$rating" },
                ratingCount: { $sum: 1 },
            },
        },
    ]);

    if (ratingStats.length > 0) {
        await Product.findByIdAndUpdate(review.product, {
            averageRating: Math.round(ratingStats[0].averageRating * 10) / 10,
            ratingCount: ratingStats[0].ratingCount,
        });
    }

    const populatedReview = await Review.findById(review._id)
        .populate("user", "name email photoUrl")
        .populate("product", "name slug");

    return populatedReview;
};

export const ReviewServices = {
    getAllReviews,
    getSingleReview,
    createReview,
};
