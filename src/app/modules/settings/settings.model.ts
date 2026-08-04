import mongoose, { Schema } from "mongoose";
import { ISettings, SettingsModel } from "./settings.interface";
import { SETTINGS_ID } from "./settings.constant";

const themeSchema = new Schema(
    {
        primaryColor: {
            type: String,
            default: "#000000",
        },
        secondaryColor: {
            type: String,
            default: "#ffffff",
        },
        fontFamily: {
            type: String,
            default: "",
        },
        logoUrl: {
            type: String,
            default: "",
        },
    },
    { _id: false },
);

const heroSchema = new Schema(
    {
        title: {
            type: String,
            default: "Welcome",
        },
        subtitle: {
            type: String,
            default: "",
        },
        backgroundImage: {
            type: String,
            default: "",
        },
        ctaText: {
            type: String,
            default: "",
        },
        ctaLink: {
            type: String,
            default: "",
        },
    },
    { _id: false },
);

const navLinkSchema = new Schema(
    {
        label: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    { _id: false },
);

const navbarSchema = new Schema(
    {
        links: {
            type: [navLinkSchema],
            default: [],
        },
    },
    { _id: false },
);

const footerSchema = new Schema(
    {
        links: {
            type: [navLinkSchema],
            default: [],
        },
        copyrightText: {
            type: String,
            default: "",
        },
        socialLinks: [
            {
                platform: {
                    type: String,
                    default: "",
                },
                url: {
                    type: String,
                    default: "",
                },
                _id: false,
            },
        ],
    },
    { _id: false },
);

const settingsSchema = new Schema<ISettings, SettingsModel>(
    {
        _id: {
            type: String,
            default: SETTINGS_ID,
        } as any,
        brandName: {
            type: String,
            default: "Demo Shop",
        },
        tagline: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
        },
        logo: {
            type: String,
            default: "",
        },
        favicon: {
            type: String,
            default: "",
        },
        theme: {
            type: themeSchema,
            default: () => ({}),
        },
        hero: {
            type: heroSchema,
            default: () => ({}),
        },
        navbar: {
            type: navbarSchema,
            default: () => ({}),
        },
        footer: {
            type: footerSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: true,
        optimisticConcurrency: true,
        toJSON: {
            transform: (_doc, ret) => {
                const { __v, ...rest } = ret;
                return rest;
            },
        },
    },
);

const Settings = mongoose.model<ISettings, SettingsModel>(
    "Settings",
    settingsSchema,
);

export default Settings;
