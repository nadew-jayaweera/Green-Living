import { put } from "@vercel/blob";

function buildBlobPath(prefix: string, fileName?: string) {
    const sanitizedPrefix = prefix.replace(/\\+/g, "/").replace(/^\/+|\/+$/g, "");
    const sanitizedName = (fileName || "image").replace(/[^a-zA-Z0-9._-]/g, "-");
    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;

    return `${sanitizedPrefix}/${uniqueSuffix}-${sanitizedName}`;
}

export async function uploadImage(buffer: Buffer, folder = "green-living", fileName?: string, contentType = "image/jpeg") {
    const path = buildBlobPath(folder, fileName);
    const blob = await put(path, buffer, {
        access: "public",
        contentType,
    });

    return blob.url;
}