import { z } from "zod";
import { SETTINGS_SECTIONS, SettingsSection } from "./settings.constant";

const themeValidationSchema = z.object({
    primaryColor: z.string().min(1, "Primary color is required"),
    secondaryColor: z.string().min(1, "Secondary color is required"),
    fontFamily: z.string().optional(),
    logoUrl: z.string().optional(),
});

const heroValidationSchema = z.object({
    title: z.string().min(1, "Hero title is required"),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
});

const navLinkValidationSchema = z.object({
    label: z.string().min(1, "Link label is required"),
    url: z.string().min(1, "Link URL is required"),
    order: z.number().min(0).optional(),
});

const navbarValidationSchema = z.object({
    links: z.array(navLinkValidationSchema).default([]),
});

const footerValidationSchema = z.object({
    links: z.array(navLinkValidationSchema).default([]),
    copyrightText: z.string().optional(),
    socialLinks: z
        .array(
            z.object({
                platform: z.string().min(1, "Platform is required"),
                url: z.string().min(1, "URL is required"),
            }),
        )
        .optional(),
});

export const sectionBodySchemas: Record<SettingsSection, z.ZodTypeAny> = {
    theme: themeValidationSchema,
    hero: heroValidationSchema,
    navbar: navbarValidationSchema,
    footer: footerValidationSchema,
};

export const updateBrandFieldsValidationSchema = z.object({
    body: z.object({
        brandName: z.string().min(1, "Brand name is required").optional(),
        tagline: z.string().optional(),
        description: z.string().optional(),
        logo: z.string().optional(),
        favicon: z.string().optional(),
    }),
});

export const SettingsValidation = {
    sectionBodySchemas,
    updateBrandFieldsValidationSchema,
    SETTINGS_SECTIONS,
};
