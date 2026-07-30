import { z } from "zod";
import { DiscountType } from "./coupon.interface";

const createCouponValidationSchema = z.object({
    body: z.object({
        code: z.string().min(1, "Coupon code is required"),
        discountType: z.nativeEnum(DiscountType, {
            errorMap: () => ({ message: "Invalid discount type" }),
        }),
        discountValue: z
            .number()
            .min(0, "Discount value must be a positive number"),
        minOrderAmount: z.number().min(0).optional().default(0),
        maxDiscountAmount: z.number().min(0).optional().default(0),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().min(1, "End date is required"),
        isActive: z.boolean().optional().default(true),
    }),
});

const updateCouponValidationSchema = z.object({
    body: z.object({
        code: z.string().min(1, "Coupon code is required").optional(),
        discountType: z
            .nativeEnum(DiscountType, {
                errorMap: () => ({ message: "Invalid discount type" }),
            })
            .optional(),
        discountValue: z
            .number()
            .min(0, "Discount value must be a positive number")
            .optional(),
        minOrderAmount: z.number().min(0).optional(),
        maxDiscountAmount: z.number().min(0).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isActive: z.boolean().optional(),
    }),
});

export const CouponValidation = {
    createCouponValidationSchema,
    updateCouponValidationSchema,
};
