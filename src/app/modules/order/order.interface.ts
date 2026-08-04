import { Document, Model, Types } from "mongoose";
import { PaymentProvider } from "../payment/payment.interface";
import { Currency } from "../../constants/currency";

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
    coupon?: string | null;
    totalAmount: number;
    discount: number;
    deliveryCharge: number;
    finalAmount: number;
    currency: Currency;
    status: OrderStatus;
    shippingAddress: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    paymentProvider?: PaymentProvider;
    // Payment tracking fields — raw gateway values (provider known via paymentProvider)
    stripeSessionId?: string;
    sslSessionKey?: string;
    transactionId?: string;
    // FX reconciliation — set when a payment is charged in a different currency
    fxRate?: number;
    fxBaseCurrency?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderModel extends Model<IOrder> {
    checkOrderExist(orderId: string): Promise<IOrder>;
}
