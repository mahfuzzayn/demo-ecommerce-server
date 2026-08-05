import { Document, Model } from "mongoose";

// ------------------------------------------------------------
// Theme
// ------------------------------------------------------------
export interface IThemeColors {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    background: string;
    foreground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    destructive: string;
    ring: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
}

export interface IThemeFonts {
    family: string;
    sizes: {
        h1: string;
        h2: string;
        h3: string;
        body: string;
        small: string;
    };
}

export interface IThemeSettings {
    colors: IThemeColors;
    dark: {
        enabled: boolean;
        colors: Partial<IThemeColors>;
    };
    fonts: IThemeFonts;
    radius: string;
    globalCss: string;
}

// ------------------------------------------------------------
// Brand / Niche
// ------------------------------------------------------------
export interface IBrandSettings {
    name: string;
    tagline: string;
    description: string;
    niche: string;
    nicheLabel: string;
    logo: string;
    favicon: string;
}

// ------------------------------------------------------------
// Hero
// ------------------------------------------------------------
export interface IHeroSlide {
    image: string;
    headline: string;
    subtext: string;
    ctaText: string;
    ctaLink: string;
    order: number;
}

export interface IHeroSection {
    slides: IHeroSlide[];
}

// ------------------------------------------------------------
// Testimonials
// ------------------------------------------------------------
export interface ITestimonialItem {
    name: string;
    role: string;
    quote: string;
    rating: number;
    avatar: string;
    order: number;
}

export interface ITestimonialSection {
    heading: string;
    items: ITestimonialItem[];
}

// ------------------------------------------------------------
// Footer
// ------------------------------------------------------------
export interface IFooterLink {
    label: string;
    url: string;
}

export interface IFooterColumn {
    title: string;
    links: IFooterLink[];
}

export interface IFooterSection {
    description: string;
    columns: IFooterColumn[];
    socialLinks: { platform: string; url: string }[];
    copyrightText: string;
    newsletter: {
        enabled: boolean;
        heading: string;
    };
}

// ------------------------------------------------------------
// Navbar
// ------------------------------------------------------------
export interface INavLink {
    label: string;
    url: string;
    order: number;
    children: INavLink[];
}

export interface INavbarSection {
    links: INavLink[];
    groups: {
        public: INavLink[];
        auth: INavLink[];
        customer: INavLink[];
        admin: INavLink[];
    };
}

// ------------------------------------------------------------
// Contact
// ------------------------------------------------------------
export interface IContactSection {
    address: string;
    phone: string;
    email: string;
    hours: string;
    mapEmbedUrl: string;
    social: {
        twitter: string;
        instagram: string;
        facebook: string;
    };
}

// ------------------------------------------------------------
// About
// ------------------------------------------------------------
export interface IAboutSection {
    story: string;
    mission: string;
    image: string;
    stats: { label: string; value: string }[];
}

// ------------------------------------------------------------
// Limited Offer
// ------------------------------------------------------------
export interface ILimitedOfferSection {
    enabled: boolean;
    badge: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    image: string;
    endsAt: string;
}

// ------------------------------------------------------------
// Settings singleton
// ------------------------------------------------------------
export interface ISettings extends Document {
    brand: IBrandSettings;
    theme: IThemeSettings;
    hero: IHeroSection;
    testimonials: ITestimonialSection;
    navbar: INavbarSection;
    footer: IFooterSection;
    contact: IContactSection;
    about: IAboutSection;
    limitedOffer: ILimitedOfferSection;
    createdAt: Date;
    updatedAt: Date;
}

export interface SettingsModel extends Model<ISettings> {}
