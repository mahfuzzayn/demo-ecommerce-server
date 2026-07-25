import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";
import multer from "multer";

const removeExtension = (filename: string) => {
    return filename.split(".").slice(0, -1).join(".");
};

const storage = new CloudinaryStorage({
    cloudinary: cloudinaryUpload,
    params: {
        folder: "/demo-ecommerce",
        public_id: (_req, file) =>
            Math.random().toString(36).substring(2) +
            "-" +
            Date.now() +
            "-" +
            file.fieldname +
            "-" +
            removeExtension(file.originalname),
    } as any,
});

export const multerUpload = multer({ storage });
