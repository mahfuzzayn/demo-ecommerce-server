export const SETTINGS_ID = "singleton";

export const SETTINGS_SECTIONS = [
    "theme",
    "hero",
    "navbar",
    "footer",
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];
