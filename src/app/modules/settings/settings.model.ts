import mongoose, { Schema } from "mongoose";
import { ISettings, SettingsModel } from "./settings.interface";
import AppError from "../../errors/appError";
import { StatusCodes } from "http-status-codes";

const settingsSectionSchema = new Schema(
    {
        key: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            default: "",
        },
        subtitle: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: "",
        },
        content: {
            type: Schema.Types.Mixed,
            default: {},
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { _id: true },
);

const settingsSchema = new Schema<ISettings, SettingsModel>(
    {
        brandName: {
            type: String,
            required: true,
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
        sections: {
            type: [settingsSectionSchema],
            default: [],
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                const { __v, ...rest } = ret;
                return rest;
            },
        },
    },
);

settingsSchema.statics.checkSettingsExist = async function (
    settingsId: string,
) {
    const existing = await this.findById(settingsId);

    if (!existing) {
        throw new AppError(StatusCodes.NOT_FOUND, "Settings not found!");
    }

    return existing;
};

const Settings = mongoose.model<ISettings, SettingsModel>(
    "Settings",
    settingsSchema,
);

export default Settings;
