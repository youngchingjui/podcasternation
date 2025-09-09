import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET_NAME;
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL; // e.g. https://cdn.example.com or https://my-bucket.s3.us-east-1.amazonaws.com
const DEFAULT_PREFIX = process.env.S3_UPLOAD_PREFIX ?? "uploads/";

const ALLOWED_FOLDERS = {
  burgers: "public/burgers/",
  outings: "public/outings/",
} as const;

type AllowedFolderKey = keyof typeof ALLOWED_FOLDERS;

type ErrorWithCode = Error & { code?: string };

function assertEnv() {
  const missing: string[] = [];
  if (!REGION) missing.push("AWS_REGION");
  if (!BUCKET) missing.push("S3_BUCKET_NAME");
  if (!process.env.AWS_ACCESS_KEY_ID) missing.push("AWS_ACCESS_KEY_ID");
  if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push("AWS_SECRET_ACCESS_KEY");
  if (missing.length) {
    const err = new Error(`Missing required env vars: ${missing.join(", ")}`) as ErrorWithCode;
    err.code = "MISSING_ENV";
    throw err;
  }
}

function keyFrom({ filename, prefix }: { filename?: string; prefix: string }) {
  const safe = (filename ?? "file")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80);
  const id = randomUUID();
  const date = new Date().toISOString().replace(/[:.]/g, "");
  return `${prefix}${date}-${id}-${safe}`;
}

function publicUrlForKey(key: string) {
  if (PUBLIC_BASE) return `${PUBLIC_BASE.replace(/\/$/, "")}/${key}`;
  // fallback to regional S3 URL
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export async function POST(req: NextRequest) {
  try {
    assertEnv();

    const body = (await req.json()) as {
      contentType?: string;
      filename?: string;
      folder?: AllowedFolderKey | string | null;
    };

    const { contentType, filename } = body;
    if (!contentType) {
      return NextResponse.json(
        {
          error: "contentType required",
          code: "VALIDATION_ERROR",
          hint: "Send the detected file MIME type as contentType (e.g. image/jpeg)",
        },
        { status: 400 },
      );
    }

    let prefix = DEFAULT_PREFIX;
    let resolvedFolder: AllowedFolderKey | null = null;

    if (body.folder != null) {
      const f = String(body.folder) as AllowedFolderKey;
      if (f in ALLOWED_FOLDERS) {
        prefix = ALLOWED_FOLDERS[f];
        resolvedFolder = f;
      } else {
        return NextResponse.json(
          {
            error: `Unsupported folder: ${body.folder}`,
            code: "UNSUPPORTED_FOLDER",
            allowed: Object.keys(ALLOWED_FOLDERS),
          },
          { status: 400 },
        );
      }
    }

    const key = keyFrom({ filename, prefix });

    const client = new S3Client({ region: REGION });
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: "public-read", // if your bucket policy allows public read, otherwise remove
    });

    const url = await getSignedUrl(client, command, { expiresIn: 60 * 5 });

    return NextResponse.json({
      url,
      key,
      folder: resolvedFolder,
      publicUrl: publicUrlForKey(key),
    });
  } catch (e) {
    console.error("presign error", e);
    const err = e as ErrorWithCode;
    const message = err?.message ?? "Internal error";
    const code = err?.code;

    // Add safe, helpful hints for common cases
    let hint: string | undefined;
    if (code === "MISSING_ENV") {
      hint = "Server is missing required AWS configuration. Ensure AWS credentials, region, and bucket name are set.";
    }

    return NextResponse.json(
      { error: message, code: code ?? "INTERNAL_ERROR", hint },
      { status: code === "MISSING_ENV" ? 500 : 500 },
    );
  }
}

