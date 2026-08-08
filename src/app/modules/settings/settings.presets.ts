// Niche presets — single source for seeding a fresh storefront.
// Source: src/docs/project-tracking/theme.config.ts (converted to the new
// Settings section shape: brand / hero.slides / about / contact / footer)
// plus a per-niche theme from settings.themes.ts so each niche has its own
// dynamic look (colors, fonts, radius).

import {
    IAboutSection,
    IBrandSettings,
    IContactSection,
    IFooterSection,
    IHeroSection,
    IThemeSettings,
} from "./settings.interface";
import {
    clothingTheme,
    perfumeOilTheme,
    eyewearTheme,
} from "./settings.themes";

// Default store currency + delivery options shared by every niche preset.
// Admins can override them later via the settings update.
const defaultCurrency: IBrandSettings["currency"] = "usd";

const defaultDeliveryOptions: IBrandSettings["deliveryOptions"] = [
    { name: "Store Pickup", charge: 0, country: "", isActive: true },
    { name: "Inside Dhaka", charge: 90, country: "BD", isActive: true },
    { name: "Outside Dhaka", charge: 150, country: "BD", isActive: true },
    { name: "International", charge: 15, country: "", isActive: true },
];

export interface ISettingsPreset {
    brand: IBrandSettings;
    theme: IThemeSettings;
    hero: IHeroSection;
    about: IAboutSection;
    contact: IContactSection;
    footer: IFooterSection;
}

export const DEFAULT_NICHE = "perfume_oil";

export const settingsPresets: Record<string, ISettingsPreset> = {
    clothing: {
        theme: clothingTheme,
        brand: {
            name: "Attor",
            tagline: "Define Your Style",
            description: "Premium clothing for the modern individual.",
            niche: "clothing",
            nicheLabel: "Clothing",
            logo: "/demo/clothing/logo.svg",
            favicon: "",
            currency: defaultCurrency,
            deliveryOptions: defaultDeliveryOptions,
        },
        hero: {
            slides: [
                {
                    image: "/demo/clothing/hero-1.webp",
                    headline: "Elevate Your Everyday Style",
                    subtext:
                        "Discover curated collections designed for those who refuse to blend in. From timeless classics to bold statements - wear what moves you.",
                    ctaText: "Shop Collection",
                    ctaLink: "/shop",
                    order: 0,
                },
                {
                    image: "/demo/clothing/hero-2.webp",
                    headline: "Crafted for the Modern Man",
                    subtext:
                        "Sharp tailoring meets everyday comfort. Explore our men's collection built for the boardroom, the weekend, and everything in between.",
                    ctaText: "Shop Men",
                    ctaLink: "/shop?category=men",
                    order: 1,
                },
                {
                    image: "/demo/clothing/hero-3.webp",
                    headline: "Effortless Style, Redefined",
                    subtext:
                        "From power dressing to casual elegance - our women's line is designed to move with you, not against you.",
                    ctaText: "Shop Women",
                    ctaLink: "/shop?category=women",
                    order: 2,
                },
            ],
        },
        about: {
            story:
                "Attor was born from a simple belief: what you wear speaks before you do. Founded in 2020, we set out to create clothing that bridges the gap between timeless craftsmanship and modern sensibility. Every piece is designed with intention - clean lines, premium fabrics, and a fit that feels like it was made for you.",
            mission:
                "We believe style shouldn't come at the expense of comfort, quality shouldn't be a luxury, and great design should be accessible. Our mission is to outfit the world with confidence - one thoughtfully crafted piece at a time.",
            image: "/demo/clothing/about.jpg",
            stats: [
                { label: "Founded", value: "2020" },
                { label: "Collections", value: "50+" },
            ],
        },
        contact: {
            address: "123 Fashion Avenue, New York, NY 10001",
            phone: "+1 (555) 123-4567",
            email: "hello@attor.com",
            hours: "Mon–Sat 9am–6pm",
            mapEmbedUrl: "",
            social: {
                twitter: "https://twitter.com/attor",
                instagram: "https://instagram.com/attor",
                facebook: "https://facebook.com/attor",
            },
        },
        footer: {
            description:
                "Premium clothing crafted for the modern individual. Quality fabrics, timeless designs, and a fit that feels like home.",
            columns: [
                {
                    title: "Shop",
                    links: [
                        { label: "Men", url: "/shop?category=men" },
                        { label: "Women", url: "/shop?category=women" },
                        { label: "Accessories", url: "/shop?category=accessories" },
                    ],
                },
            ],
            socialLinks: [
                { platform: "twitter", url: "https://twitter.com/attor" },
                { platform: "instagram", url: "https://instagram.com/attor" },
                { platform: "facebook", url: "https://facebook.com/attor" },
            ],
            copyrightText: "© 2026 Attor. All rights reserved.",
            newsletter: {
                enabled: true,
                heading: "Subscribe for exclusive offers",
            },
        },
    },
    perfume_oil: {
        theme: perfumeOilTheme,
        brand: {
            name: "Attor",
            tagline: "Essence of Distinction",
            description: "Premium perfume oils crafted for the discerning.",
            niche: "perfume_oil",
            nicheLabel: "Perfume Oil",
            logo: "/demo/perfume-oil/logo.png",
            favicon: "",
            currency: defaultCurrency,
            deliveryOptions: defaultDeliveryOptions,
        },
        hero: {
            slides: [
                {
                    image: "/demo/perfume-oil/banner/hero-1.webp",
                    headline: "Discover Your Signature Scent",
                    subtext:
                        "Explore our curated collection of artisanal perfume oils - from deep, smoky ouds to luminous florals. Find the fragrance that speaks to you.",
                    ctaText: "Explore Collection",
                    ctaLink: "/shop",
                    order: 0,
                },
                {
                    image: "/demo/perfume-oil/banner/hero-2.webp",
                    headline: "The Art of Oud",
                    subtext:
                        "Journey through our collection of rare and precious oud oils - aged, layered, and utterly unforgettable.",
                    ctaText: "Shop Oud Collection",
                    ctaLink: "/shop?category=oud",
                    order: 1,
                },
                {
                    image: "/demo/perfume-oil/banner/hero-3.webp",
                    headline: "Bloom in Every Drop",
                    subtext:
                        "From Damask rose to jasmine sambac - our floral attars capture nature's most exquisite moments in every bottle.",
                    ctaText: "Shop Florals",
                    ctaLink: "/shop?category=floral",
                    order: 2,
                },
            ],
        },
        about: {
            story:
                "Attor began with a passion for the ancient art of perfumery. Rooted in tradition yet crafted for the modern connoisseur, each of our perfume oils is a journey - from the misty forests of Assam to the sun-drenched gardens of Grasse. We work directly with distillers and growers to bring you the purest expressions of nature's most precious botanicals.",
            mission:
                "We believe fragrance is the most intimate form of expression. Our mission is to make artisanal perfume oils accessible - offering uncompromising quality, ethical sourcing, and a sensory experience that transcends the ordinary.",
            image: "/demo/perfume-oil/about.jpeg",
            stats: [
                { label: "Founded", value: "2018" },
                { label: "Oud Variants", value: "30+" },
            ],
        },
        contact: {
            address: "123 Perfume Avenue, New York, NY 10001",
            phone: "+1 (555) 123-4567",
            email: "hello@attor.com",
            hours: "Mon–Sat 9am–6pm",
            mapEmbedUrl: "",
            social: {
                twitter: "https://twitter.com/attor",
                instagram: "https://instagram.com/attor",
                facebook: "https://facebook.com/attor",
            },
        },
        footer: {
            description:
                "Artisanal perfume oils crafted for those who seek the extraordinary. Pure ingredients, timeless scents, and a story in every drop.",
            columns: [
                {
                    title: "Shop",
                    links: [
                        { label: "Oud", url: "/shop?category=oud" },
                        { label: "Floral", url: "/shop?category=floral" },
                        { label: "Citrus", url: "/shop?category=citrus" },
                    ],
                },
            ],
            socialLinks: [
                { platform: "twitter", url: "https://twitter.com/attor" },
                { platform: "instagram", url: "https://instagram.com/attor" },
                { platform: "facebook", url: "https://facebook.com/attor" },
            ],
            copyrightText: "© 2026 Attor. All rights reserved.",
            newsletter: {
                enabled: true,
                heading: "Subscribe for exclusive offers",
            },
        },
    },
    eyewear: {
        theme: eyewearTheme,
        brand: {
            name: "Attor Optics",
            tagline: "See Clearly, Look Sharp",
            description: "Premium eyewear for the discerning eye.",
            niche: "eyewear",
            nicheLabel: "Eyewear",
            logo: "/demo/eyewear/logo.svg",
            favicon: "",
            currency: defaultCurrency,
            deliveryOptions: defaultDeliveryOptions,
        },
        hero: {
            slides: [
                {
                    image: "/demo/eyewear/hero.jpg",
                    headline: "Frame Your World in Style",
                    subtext:
                        "Handcrafted eyewear that blends precision optics with bold design. Find your perfect frame - from classic sophistication to modern edge.",
                    ctaText: "Browse Frames",
                    ctaLink: "/shop",
                    order: 0,
                },
                {
                    image: "/demo/eyewear/cat-sunglasses.jpg",
                    headline: "Sun's Out, Style On",
                    subtext:
                        "Block the glare, turn up the look. Our sunglasses collection pairs UV protection with undeniable attitude.",
                    ctaText: "Shop Sunglasses",
                    ctaLink: "/shop?category=sunglasses",
                    order: 1,
                },
                {
                    image: "/demo/eyewear/cat-optical.jpg",
                    headline: "See the Difference",
                    subtext:
                        "Everyday optical frames engineered for comfort and clarity. Because your vision deserves the best fit.",
                    ctaText: "Shop Optical",
                    ctaLink: "/shop?category=optical",
                    order: 2,
                },
            ],
        },
        about: {
            story:
                "Attor Optics began with a clear vision: create eyewear that's as functional as it is beautiful. Since 2021, we've partnered with master craftsmen to produce frames that balance precision optics with distinctive design - because how you see the world should be as sharp as how the world sees you.",
            mission:
                "Great vision deserves great frames. We're on a mission to make premium eyewear accessible - combining expert craftsmanship, premium materials, and bold design at prices that don't break the bank.",
            image: "/demo/eyewear/about.jpg",
            stats: [
                { label: "Founded", value: "2021" },
                { label: "Frames", value: "120+" },
            ],
        },
        contact: {
            address: "456 Vision Drive, San Francisco, CA 94102",
            phone: "+1 (555) 987-6543",
            email: "hello@attoroptics.com",
            hours: "Mon–Sat 10am–7pm",
            mapEmbedUrl: "",
            social: {
                twitter: "https://twitter.com/attoroptics",
                instagram: "https://instagram.com/attoroptics",
                facebook: "https://facebook.com/attoroptics",
            },
        },
        footer: {
            description:
                "Premium eyewear crafted for the discerning eye. Precision optics, bold frames, and vision that stands out.",
            columns: [
                {
                    title: "Shop",
                    links: [
                        { label: "Sunglasses", url: "/shop?category=sunglasses" },
                        { label: "Optical", url: "/shop?category=optical" },
                        { label: "Kids", url: "/shop?category=kids" },
                    ],
                },
            ],
            socialLinks: [
                { platform: "twitter", url: "https://twitter.com/attoroptics" },
                { platform: "instagram", url: "https://instagram.com/attoroptics" },
                { platform: "facebook", url: "https://facebook.com/attoroptics" },
            ],
            copyrightText: "© 2026 Attor Optics. All rights reserved.",
            newsletter: {
                enabled: true,
                heading: "Subscribe for exclusive offers",
            },
        },
    },
};
