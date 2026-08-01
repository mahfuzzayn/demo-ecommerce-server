import { Document, Model, Types } from "mongoose";

export interface ISettingsSection {
    key: string;
    title: string;
    subtitle?: string;
    description?: string;
    image?: string;
    content?: Record<string, unknown>;
    isActive: boolean;
}

export interface ISettings extends Document {
    brandName: string;
    tagline: string;
    description: string;
    logo: string;
    favicon?: string;
    sections: ISettingsSection[];
    isDeleted: boolean;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface SettingsModel extends Model<ISettings> {
    checkSettingsExist(settingsId: string): Promise<ISettings>;
}
