import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import Settings from "./settings.model";
import { ISettings } from "./settings.interface";
import { SETTINGS_ID } from "./settings.constant";
import { settingsCache } from "./settings.cache";
import { IImageFile } from "../../interface/IImageFile";

const getSettings = async (): Promise<ISettings> => {
    const cached = settingsCache.get();
    if (cached) return cached;

    const settings = await Settings.findById(SETTINGS_ID);

    if (!settings) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "Settings not seeded. Run the settings seed script.",
        );
    }

    const data = settings.toObject();
    settingsCache.set(data as ISettings);

    return data as ISettings;
};

const updateSection = async <K extends keyof ISettings>(
    section: K,
    data: Partial<ISettings[K]>,
) => {
    const updated = await Settings.findByIdAndUpdate(
        SETTINGS_ID,
        { $set: { [section]: data } },
        { new: true, runValidators: true },
    );

    if (!updated) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "Settings not seeded. Run the settings seed script.",
        );
    }

    settingsCache.invalidate();

    return updated.toObject();
};

const updateBrandFields = async (
    payload: Partial<ISettings>,
    file?: IImageFile,
) => {
    const update: Partial<ISettings> = {};

    if (payload.brandName !== undefined) update.brandName = payload.brandName;
    if (payload.tagline !== undefined) update.tagline = payload.tagline;
    if (payload.description !== undefined)
        update.description = payload.description;
    if (payload.logo !== undefined) update.logo = payload.logo;
    if (payload.favicon !== undefined) update.favicon = payload.favicon;

    if (file?.path) {
        update.logo = file.path;
    }

    const updated = await Settings.findByIdAndUpdate(
        SETTINGS_ID,
        { $set: update },
        { new: true, runValidators: true },
    );

    if (!updated) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "Settings not seeded. Run the settings seed script.",
        );
    }

    settingsCache.invalidate();

    return updated.toObject();
};

export const SettingsServices = {
    getSettings,
    updateSection,
    updateBrandFields,
};
