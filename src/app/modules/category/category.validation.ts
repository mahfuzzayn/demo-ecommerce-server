import { z } from "zod";

const createCategoryValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Category name is required"),
        description: z.string().optional().default(""),
        parent: z.string().optional().nullable().default(null),
        isActive: z.boolean().optional().default(true),
    }),
});

const updateCategoryValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Category name is required").optional(),
        description: z.string().optional(),
        parent: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
    }),
});

export const CategoryValidation = {
    createCategoryValidationSchema,
    updateCategoryValidationSchema,
};
