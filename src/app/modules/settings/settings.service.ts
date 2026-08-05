import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import Settings from "./settings.model";
import { ISettings } from "./settings.interface";
import { SETTINGS_ID, SettingsSection } from "./settings.constant";
import { settingsCache } from "./settings.cache";
import { settingsPresets, DEFAULT_NICHE } from "./settings.presets";

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

// Maps uploaded files into the section body by position (same semantics as
// the product module: re-send the whole section, image fields come from files).
const mapSectionFiles = <T extends Record<string, unknown>>(
    section: SettingsSection,
    body: T,
    files?: Express.Multer.File[],
): T => {
    if (!files?.length) return body;

    if (section === "hero") {
        const slides = (body as any).slides as any[] | undefined;
        if (slides) {
            slides.forEach((slide, i) => {
                if (files[i]) slide.image = files[i].path;
            });
        }
    } else if (section === "testimonials") {
        const items = (body as any).items as any[] | undefined;
        if (items) {
            items.forEach((item, i) => {
                if (files[i]) item.avatar = files[i].path;
            });
        }
    } else if (section === "about") {
        (body as any).image = files[0]?.path ?? (body as any).image;
    } else if (section === "limitedOffer") {
        (body as any).image = files[0]?.path ?? (body as any).image;
    }

    return body;
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

    return updated.toObject();
};

const updateBrandFields = async (
    payload: Partial<ISettings["brand"]>,
    files?: { logo?: Express.Multer.File[]; favicon?: Express.Multer.File[] },
) => {
    const update: Partial<ISettings["brand"]> = { ...payload };

    if (files?.logo?.length) {
        update.logo = files.logo[0].path;
    }

    if (files?.favicon?.length) {
        update.favicon = files.favicon[0].path;
    }

    const updated = await Settings.findByIdAndUpdate(
        SETTINGS_ID,
        { $set: { brand: update } },
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
