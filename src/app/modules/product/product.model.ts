import mongoose, { Schema } from "mongoose";
import { IProduct, ProductModel } from "./product.interface";
import AppError from "../../errors/appError";
import { StatusCodes } from "http-status-codes";

const specificationSchema = new Schema(
    {
        key: {
            type: String,
            required: true,
        },
        value: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

const productSchema = new Schema<IProduct, ProductModel>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: false,
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        weight: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        imageUrls: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        brand: {
            type: Schema.Types.ObjectId,
            ref: "Brand",
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: "Review",
                default: [],
            },
        ],
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        ratingCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        availableColors: {
            type: [String],
            default: [],
        },
        specification: {
            type: [specificationSchema],
            default: [],
        },
        keyFeatures: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { __v, ...rest } = ret;
                return rest;
            },
        },
    },
);

// Generate slug from name before saving only when a slug isn't provided
productSchema.pre("save", async function (next) {
    if (this.isModified("name") && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }
    next();
});

productSchema.statics.checkProductExist = async function (productId: string) {
    const existingProduct = await this.findOne({
        _id: productId,
        isDeleted: false,
    });

    if (!existingProduct) {
        throw new AppError(StatusCodes.NOT_FOUND, "Product does not exist!");
    }

    return existingProduct;
};

productSchema.statics.isSlugUnique = async function (
    slug: string,
    excludeId?: string,
) {
    const query: Record<string, unknown> = { slug };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    const existing = await this.findOne(query);
    return !existing;
};

const Product = mongoose.model<IProduct, ProductModel>("Product", productSchema);

export default Product;
