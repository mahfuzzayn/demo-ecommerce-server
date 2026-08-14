import { v2 as cloudinary } from "cloudinary";
import config from "../config";

cloudinary.config({
    cloud_name: config.cloudinary_cloud_name,
    api_key: config.cloudinary_api_key,
    api_secret: config.cloudinary_api_secret,
});

export const cloudinaryUpload = cloudinary;

// Best-effort destroy of a set of Cloudinary publicIds. A missing/invalid id
// is ignored — a stale image should never fail the caller's operation. Returns
// the count actually deleted.
export const destroyImagesFromCloudinary = async (
    publicIds: string[],
): Promise<number> => {
    const uniqueIds = [...new Set(publicIds.filter(Boolean))];
    if (!uniqueIds.length) return 0;

    const results = await Promise.all(
        uniqueIds.map((id) =>
            cloudinary.uploader.destroy(id).catch(() => undefined),
        ),
    );
    return results.filter((r) => r && r.result === "ok").length;
};
