import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import Settings from "./settings.model";
import { ISettings } from "./settings.interface";
import { SETTINGS_ID, SettingsSection } from "./settings.constant";
import { settingsCache } from "./settings.cache";
import { settingsPresets, DEFAULT_NICHE } from "./settings.presets";
import { ActivityServices } from "../activity/activity.service";
import { ActivityModule, ActivityType } from "../activity/activity.interface";
import { mapSectionFiles } from "./settings.utils";

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

const updateSection = async <K extends SettingsSection>(
    section: K,
    data: Partial<ISettings[K]>,
    files?: Express.Multer.File[],
) => {
    const body = mapSectionFiles(section, data, files);

    const updated = await Settings.findByIdAndUpdate(
        SETTINGS_ID,
        { $set: { [section]: body } },
        { new: true, runValidators: true },
    );

    if (!updated) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "Settings not seeded. Run the settings seed script.",
        );
    }

    settingsCache.invalidate();

    await ActivityServices.logActivity({
        module: ActivityModule.SETTINGS,
        type: ActivityType.UPDATE,
        message: `Settings section "${section}" was updated`,
        metadata: { section },
    });

    return updated.toObject();
};

const updateBrandFields = async (
    payload: Partial<ISettings["brand"]>,
    files?: { logo?: Express.Multer.File[]; favicon?: Express.Multer.File[] },
) => {
    // Build a $set with dotted paths — ONLY for fields actually provided.
    // This preserves any field the client didn't send (e.g. logo/favicon stay
    // unchanged instead of being reset to "" by a full brand sub-doc replace).
    const set: Record<string, unknown> = {};

    if (payload && typeof payload === "object") {
        for (const [key, value] of Object.entries(payload)) {
            if (value !== undefined) {
                set[`brand.${key}`] = value;
            }
        }
    }

    // Uploaded files override the corresponding text fields.
    if (files?.logo?.length) {
        set["brand.logo"] = files.logo[0].path;
    }

    if (files?.favicon?.length) {
        set["brand.favicon"] = files.favicon[0].path;
    }

    // Nothing to update → 400 instead of a pointless write.
    if (Object.keys(set).length === 0) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "No brand fields provided to update!",
        );
    }

    const updated = await Settings.findByIdAndUpdate(
        SETTINGS_ID,
        { $set: set },
        { new: true, runValidators: true },
    );

    if (!updated) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "Settings not seeded. Run the settings seed script.",
        );
    }

    settingsCache.invalidate();

    await ActivityServices.logActivity({
        module: ActivityModule.SETTINGS,
        type: ActivityType.UPDATE,
        message: "Brand settings were updated",
        metadata: { fields: Object.keys(set) },
    });

    return updated.toObject();
};

// Applies a niche preset (brand + hero + about + contact + footer) in one shot.
const applyNichePreset = async (niche: string) => {
    const preset = settingsPresets[niche];

    if (!preset) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            `No settings preset found for niche "${niche}".`,
        );
    }

    const updated = await Settings.findByIdAndUpdate(
        SETTINGS_ID,
        { $set: preset },
        { new: true, runValidators: true },
    );

    if (!updated) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "Settings not seeded. Run the settings seed script.",
        );
    }

    settingsCache.invalidate();

    await ActivityServices.logActivity({
        module: ActivityModule.SETTINGS,
        type: ActivityType.PRESET,
        message: `"${niche}" niche preset was applied`,
        metadata: { niche },
    });

    return updated.toObject();
};

const applyDefaultPreset = async () => applyNichePreset(DEFAULT_NICHE);

export const SettingsServices = {
    getSettings,
    updateSection,
    updateBrandFields,
    applyNichePreset,
    applyDefaultPreset,
};
