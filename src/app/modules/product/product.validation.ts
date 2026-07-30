import { z } from "zod";

const specificationSchema = z.object({
    key: z.string().min(1, "Specification key is required"),
    value: z.string().min(1, "Specification value is required"),
});

const createProductValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Product name is required"),
        description: z.string().min(1, "Description is required"),
        price: z.number().min(0, "Price must be a positive number"),
        stock: z.number().min(0, "Stock must be a non-negative number").default(0),
        weight: z.number().min(0, "Weight must be a positive number"),
        category: z.string().min(1, "Category ID is required"),
        brand: z.string().min(1, "Brand ID is required"),
        imageUrls: z.array(z.string()).optional().default([]),
        isActive: z.boolean().optional().default(true),
        availableColors: z.array(z.string()).optional().default([]),
        specification: z.array(specificationSchema).optional().default([]),
        keyFeatures: z.array(z.string()).optional().default([]),
    }),
});

const updateProductValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Product name is required").optional(),
        description: z.string().min(1, "Description is required").optional(),
        price: z.number().min(0, "Price must be a positive number").optional(),
        stock: z.number().min(0, "Stock must be a non-negative number").optional(),
        weight: z.number().min(0, "Weight must be a positive number").optional(),
        category: z.string().min(1, "Category ID is required").optional(),
        brand: z.string().min(1, "Brand ID is required").optional(),
        imageUrls: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        availableColors: z.array(z.string()).optional(),
        specification: z.array(specificationSchema).optional(),
        keyFeatures: z.array(z.string()).optional(),
    }),
});

export const ProductValidation = {
    createProductValidationSchema,
    updateProductValidationSchema,
};
