import { z } from "zod";
import { OrderStatus, PaymentMethod } from "./order.interface";

const orderProductSchema = z.object({
    product: z.string().min(1, "Product ID is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be a positive number"),
});

const createOrderValidationSchema = z.object({
    body: z.object({
        products: z
            .array(orderProductSchema)
            .min(1, "At least one product is required"),
        coupon: z.string().optional(),
        totalAmount: z.number().min(0, "Total amount must be a positive number"),
        discount: z.number().min(0).default(0),
        deliveryCharge: z.number().min(0).default(0),
        finalAmount: z.number().min(0, "Final amount must be a positive number"),
        shippingAddress: z
            .string()
            .min(1, "Shipping address is required"),
        paymentMethod: z.nativeEnum(PaymentMethod, {
            errorMap: () => ({ message: "Invalid payment method" }),
        }),
    }),
});

const updateOrderStatusValidationSchema = z.object({
    body: z.object({
        status: z.nativeEnum(OrderStatus, {
            errorMap: () => ({ message: "Invalid order status" }),
        }),
    }),
});

export const OrderValidation = {
    createOrderValidationSchema,
    updateOrderStatusValidationSchema,
};
