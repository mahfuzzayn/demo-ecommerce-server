import { Document, Model } from "mongoose";

export interface IThemeSettings {
    primaryColor: string;
    secondaryColor: string;
    fontFamily?: string;
    logoUrl?: string;
}

export interface IHeroSection {
    title: string;
    subtitle?: string;
    backgroundImage?: string;
    ctaText?: string;
    ctaLink?: string;
}

export interface INavLink {
    label: string;
    url: string;
    order: number;
}

export interface INavbarSection {
    links: INavLink[];
}

export interface IFooterSection {
    links: INavLink[];
    copyrightText?: string;
    socialLinks?: { platform: string; url: string }[];
}

export interface ISettings extends Document {
    theme: IThemeSettings;
    hero: IHeroSection;
    navbar: INavbarSection;
    footer: IFooterSection;
    brandName: string;
    tagline: string;
    description: string;
    logo: string;
    favicon?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SettingsModel extends Model<ISettings> {}
