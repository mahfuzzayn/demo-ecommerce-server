import { Document, Model, Types } from "mongoose";
import { Currency } from "../../constants/currency";

// Specification key-value pair
export interface ISpecification {
    key: string;
    value: string;
}

// Product Schema Definition
export interface IProduct extends Document {
    name: string;
    slug: string;
    description: string;
    price: number;
    currency: Currency;
    stock: number;
    weight: number;
    category: Types.ObjectId;
    imageUrls: string[];
    isActive: boolean;
    isDeleted: boolean;
    brand: Types.ObjectId;
    createdBy: Types.ObjectId;
    reviews: Types.ObjectId[];
    averageRating: number;
    ratingCount: number;
    availableColors: string[];
    specification: ISpecification[];
    keyFeatures: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductModel extends Model<IProduct> {
    // Check if product exists by ID
    checkProductExist(productId: string): Promise<IProduct>;
    // Check if slug is unique
    isSlugUnique(slug: string, excludeId?: string): Promise<boolean>;
}
