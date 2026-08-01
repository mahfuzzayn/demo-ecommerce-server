import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { ISettings, ISettingsSection } from "./settings.interface";
import Settings from "./settings.model";
import { IJwtPayload } from "../auth/auth.interface";
import { IImageFile } from "../../interface/IImageFile";

const getSettings = async () => {
    const settings = await Settings.findOne({ isDeleted: false }).sort({
        createdAt: -1,
    });
    return settings;
};

const createSettings = async (
    payload: Partial<ISettings>,
    authUser: IJwtPayload,
    file?: IImageFile,
) => {
    payload.createdBy = authUser.userId as any;

    if (file?.path) {
        payload.logo = file.path;
    }

    const settings = await Settings.create(payload);
    return settings;
};

const updateSettings = async (
    settingsId: string,
    payload: Partial<ISettings>,
    file?: IImageFile,
) => {
    await Settings.checkSettingsExist(settingsId);

    if (file?.path) {
        payload.logo = file.path;
    }

    const result = await Settings.findByIdAndUpdate(settingsId, payload, {
        new: true,
    });

    return result;
};

const updateSettingsSection = async (
    settingsId: string,
    sectionKey: string,
    payload: Partial<ISettingsSection>,
    file?: IImageFile,
) => {
    const settings = await Settings.checkSettingsExist(settingsId);

    const sectionIndex = settings.sections.findIndex(
        (section) => section.key === sectionKey,
    );

    if (sectionIndex === -1) {
        throw new AppError(StatusCodes.NOT_FOUND, "Section not found!");
    }

    const section = settings.sections[sectionIndex];

    if (file?.path) {
        payload.image = file.path;
    }

    settings.sections[sectionIndex] = {
        ...section,
        ...payload,
    };

    await settings.save();

    return settings.sections[sectionIndex];
};

const deleteSettings = async (settingsId: string) => {
    const settings = await Settings.checkSettingsExist(settingsId);

    settings.isDeleted = true;
    await settings.save();

    return settings;
};

export const SettingsServices = {
    getSettings,
    createSettings,
    updateSettings,
    updateSettingsSection,
    deleteSettings,
};
