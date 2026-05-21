import dotenv from "dotenv";
import admin from "firebase-admin";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v2: cloudinary } = require("cloudinary");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function ensureDatabaseUrl() {
  const current = process.env.DATABASE_URL;
  if (!current || current.startsWith("file:./") || current.startsWith("file:../")) {
    const absolute = pathToFileURL(path.resolve(process.cwd(), "prisma", "dev.db")).href;
    process.env.DATABASE_URL = absolute;
    log("DATABASE_URL:", absolute);
    return;
  }
  log("DATABASE_URL:", current);
}

ensureDatabaseUrl();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync } = require("node:sqlite");

const databasePath = fileURLToPath(process.env.DATABASE_URL as string);
const sqliteDb = new DatabaseSync(databasePath, { readOnly: true });

const DRY = process.argv.includes("--dry");
const FIRESTORE_STRING_LIMIT = 900_000;

function log(...args: any[]) {
  console.log("[migrate-to-firestore]", ...args);
}

function getServiceAccount() {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }
    throw new Error("Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON");
  }
  log("GOOGLE_APPLICATION_CREDENTIALS:", path);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(path);
}

function convertDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return admin.firestore.Timestamp.fromDate(obj);
  if (Array.isArray(obj)) return obj.map(convertDates);
  if (typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) out[k] = convertDates(v);
    return out;
  }
  return obj;
}

function sanitizeForFirestore(value: unknown, fieldPath = "root"): unknown {
  if (typeof value === "string") {
    if (Buffer.byteLength(value, "utf8") > FIRESTORE_STRING_LIMIT) {
      log(`Trimming oversized string at ${fieldPath} (${Buffer.byteLength(value, "utf8")} bytes)`);
      return `[omitted oversized string: ${Buffer.byteLength(value, "utf8")} bytes]`;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeForFirestore(item, `${fieldPath}[${index}]`));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = sanitizeForFirestore(item, `${fieldPath}.${key}`);
    }
    return out;
  }
  return value;
}

function isDataImageUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/");
}

async function uploadDataImageToCloudinary(dataUrl: string, publicId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to migrate imageUrl data URIs");
  }

  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUrl,
      {
        folder: "green-living/uploads",
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
      },
      (error: any, result: any) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
  });
}

async function writeCollection(collectionName: string, records: any[]) {
  if (!records.length) return;
  const db = admin.firestore();
  const chunkSize = 400; // safe under 500 limit
  for (let i = 0; i < records.length; i += chunkSize) {
    const batch = db.batch();
    const chunk = records.slice(i, i + chunkSize);
    for (const rec of chunk) {
      const docRef = db.collection(collectionName).doc(rec.id);
      const data = { ...rec };
      delete data.id; // id will be doc id
      const sanitized = sanitizeForFirestore(data, `${collectionName}.${rec.id}`);
      if (DRY) {
        // don't write in dry mode; just show a sample
        log(`DRY: would write doc ${rec.id} to ${collectionName}`);
      } else {
        batch.set(docRef, convertDates(sanitized));
      }
    }
    if (!DRY) {
      await batch.commit();
      log(`Wrote ${Math.min(i + chunkSize, records.length)}/${records.length} to ${collectionName}`);
    } else {
      log(`DRY: would commit ${Math.min(i + chunkSize, records.length)}/${records.length} to ${collectionName}`);
    }
  }
}

function readTable(tableName: string) {
  return sqliteDb.prepare(`SELECT * FROM "${tableName}"`).all();
}

function parseDateValue(value: unknown) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (typeof value !== "string") return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
}

function normalizeRow(row: Record<string, unknown>) {
  const normalized: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(normalized)) {
    if (key.endsWith("At") || key.endsWith("Date")) {
      normalized[key] = parseDateValue(value);
    }
  }
  return normalized;
}

async function prepareUploads(rows: Record<string, unknown>[]) {
  const prepared: Record<string, unknown>[] = [];

  for (const row of rows) {
    const upload = { ...row };
    const imageUrl = upload.imageUrl;
    if (isDataImageUrl(imageUrl)) {
      log(`Uploading image for upload ${upload.id} to Cloudinary`);
      upload.imageUrl = DRY ? `[dry-run cloudinary upload for ${upload.id}]` : await uploadDataImageToCloudinary(imageUrl, `upload-${upload.id}`);
    }
    prepared.push(upload);
  }

  return prepared;
}

async function main() {
  const serviceAccount = getServiceAccount();
  log("Service account project_id:", serviceAccount.project_id ?? "(unknown)");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  try {
    const app = admin.apps[0];
    log("Initialized Firebase app. app.name:", app ? app.name : "(none)");
  } catch (e) {
    // ignore
  }

  try {
    log("SQLite database path:", databasePath);

    // Read rows directly from SQLite instead of Prisma so migration does not
    // depend on Prisma client/database engine availability.
    const users = readTable("User").map(normalizeRow);
    const badges = readTable("Badge").map(normalizeRow);
    const userBadges = readTable("UserBadge").map(normalizeRow);
    const uploads = readTable("Upload").map(normalizeRow);
    const forumPosts = readTable("ForumPost").map(normalizeRow);
    const comments = readTable("Comment").map(normalizeRow);
    const likes = readTable("Like").map(normalizeRow);

    log(`Fetched counts — users:${users.length} badges:${badges.length} userBadges:${userBadges.length} uploads:${uploads.length} forumPosts:${forumPosts.length} comments:${comments.length} likes:${likes.length}`);

    // Keep hashed passwords so credential login can continue after migration.
    const safeUsers = users;

    const preparedUploads = await prepareUploads(uploads as any);

    await writeCollection("users", safeUsers as any);
    await writeCollection("badges", badges as any);
    await writeCollection("userBadges", userBadges as any);
    await writeCollection("uploads", preparedUploads as any);
    await writeCollection("forumPosts", forumPosts as any);
    await writeCollection("comments", comments as any);
    await writeCollection("likes", likes as any);

    log("Migration complete.");
  } catch (err) {
    console.error("Migration error:", err);
    process.exitCode = 1;
  } finally {
    sqliteDb.close();
    process.exit();
  }
}

main();
