import { z } from "zod";
import { OrderStatus, PaymentMethod } from "./order.interface";

const orderProductSchema = z.object({
    product: z.string().min(1, "Product ID is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
});

const createOrderValidationSchema = z.object({
    body: z.object({
        products: z
            .array(orderProductSchema)
            .min(1, "At least one product is required"),
        coupon: z.string().optional(),
        deliveryCharge: z.number().min(0).default(0),
        shippingAddress: z
            .string()
            .min(1, "Shipping address is required"),
        recipientName: z
            .string()
            .min(1, "Recipient name is required"),
        phoneNo: z
            .string()
            .min(1, "Phone number is required"),
        notes: z.string().optional(),
        paymentMethod: z.nativeEnum(PaymentMethod, {
            errorMap: () => ({ message: "Invalid payment method" }),
        }),
    }),
});

const updateOrderValidationSchema = z.object({
    body: z.object({
        products: z.array(orderProductSchema).min(1).optional(),
        coupon: z.string().nullable().optional(),
        deliveryCharge: z.number().min(0).optional(),
        shippingAddress: z.string().min(1).optional(),
        recipientName: z.string().min(1).optional(),
        phoneNo: z.string().min(1).optional(),
        notes: z.string().optional(),
        paymentMethod: z
            .nativeEnum(PaymentMethod, {
                errorMap: () => ({ message: "Invalid payment method" }),
            })
            .optional(),
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
    updateOrderValidationSchema,
    updateOrderStatusValidationSchema,
};
