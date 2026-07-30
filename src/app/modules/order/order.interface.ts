import { Document, Model, Types } from "mongoose";

// Order status enum
export enum OrderStatus {
    PENDING = "Pending",
    PROCESSING = "Processing",
    SHIPPED = "Shipped",
    COMPLETED = "Completed",
    CANCELLED = "Cancelled",
}

// Payment method enum
export enum PaymentMethod {
    COD = "COD",
    ONLINE = "Online",
}

// Payment status enum
export enum PaymentStatus {
    PENDING = "Pending",
    PAID = "Paid",
    FAILED = "Failed",
}

// Order product sub-document
export interface IOrderProduct {
    product: Types.ObjectId;
    quantity: number;
    unitPrice: number;
}

// Order Schema Definition
export interface IOrder extends Document {
    user: Types.ObjectId;
    products: IOrderProduct[];
    coupon?: string;
    totalAmount: number;
    discount: number;
    deliveryCharge: number;
    finalAmount: number;
    status: OrderStatus;
    shippingAddress: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    sslSessionKey?: string;
    sslTransactionId?: string;
    stripeSessionId?: string;
    paymentIntentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderModel extends Model<IOrder> {
    checkOrderExist(orderId: string): Promise<IOrder>;
}
