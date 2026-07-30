import { z } from "zod";

const createBrandValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Brand name is required"),
        isActive: z.boolean().optional().default(true),
    }),
});

const updateBrandValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Brand name is required").optional(),
        isActive: z.boolean().optional(),
    }),
});

export const BrandValidation = {
    createBrandValidationSchema,
    updateBrandValidationSchema,
};
