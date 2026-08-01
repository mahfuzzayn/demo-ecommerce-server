import { z } from "zod";

const sectionValidationSchema = z.object({
    key: z.string().min(1, "Section key is required"),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    content: z.record(z.unknown()).optional(),
    isActive: z.boolean().optional(),
});

const createSettingsValidationSchema = z.object({
    body: z.object({
        brandName: z.string().min(1, "Brand name is required"),
        tagline: z.string().optional(),
        description: z.string().optional(),
        logo: z.string().optional(),
        favicon: z.string().optional(),
        sections: z.array(sectionValidationSchema).optional(),
    }),
});

const updateSettingsValidationSchema = z.object({
    body: z.object({
        brandName: z.string().min(1, "Brand name is required").optional(),
        tagline: z.string().optional(),
        description: z.string().optional(),
        logo: z.string().optional(),
        favicon: z.string().optional(),
        sections: z.array(sectionValidationSchema).optional(),
    }),
});

export const SettingsValidation = {
    createSettingsValidationSchema,
    updateSettingsValidationSchema,
};
