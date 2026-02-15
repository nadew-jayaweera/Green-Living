import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer to Cloudinary.
 * Returns the secure URL of the uploaded image.
 * Falls back to a data URL if Cloudinary is not configured.
 */
export async function uploadImage(buffer: Buffer, folder: string = "green-living"): Promise<string> {
    // If Cloudinary is not configured, use base64 data URL as fallback
    if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ) {
        console.warn("Cloudinary not configured, falling back to local storage (base64).");
        try {
            const base64 = buffer.toString("base64");
            return `data:image/jpeg;base64,${base64}`;
        } catch (error) {
            console.error("Base64 conversion failed:", error);
            throw new Error("Failed to process image locally.");
        }
    }

    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                {
                    folder,
                    resource_type: "image",
                    transformation: [
                        { width: 1200, height: 1200, crop: "limit" },
                        { quality: "auto", fetch_format: "auto" },
                    ],
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result!.secure_url);
                }
            )
            .end(buffer);
    });
}

export default cloudinary;
