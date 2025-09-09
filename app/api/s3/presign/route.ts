import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET_NAME;
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL; // e.g. https://cdn.example.com or https://my-bucket.s3.us-east-1.amazonaws.com
const PREFIX = process.env.S3_UPLOAD_PREFIX ?? "uploads/";

function assertEnv() {
  const missing: string[] = [];
  if (!REGION) missing.push("AWS_REGION");
  if (!BUCKET) missing.push("S3_BUCKET_NAME");
  if (!process.env.AWS_ACCESS_KEY_ID) missing.push("AWS_ACCESS_KEY_ID");
  if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push("AWS_SECRET_ACCESS_KEY");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

function keyFrom(filename?: string) {
  const safe = (filename ?? "file")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80);
  const id = randomUUID();
  const date = new Date().toISOString().replace(/[:.]/g, "");
  return `${PREFIX}${date}-${id}-${safe}`;
}

function publicUrlForKey(key: string) {
  if (PUBLIC_BASE) return `${PUBLIC_BASE.replace(/\/$/, "")}/${key}`;
  // fallback to regional S3 URL
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export async function POST(req: NextRequest) {
  try {
    assertEnv();

    const { contentType, filename } = (await req.json()) as {
      contentType?: string;
      filename?: string;
    };
    if (!contentType) {
      return NextResponse.json(
        { error: "contentType required" },
        { status: 400 },
      );
    }

    const key = keyFrom(filename);

    const client = new S3Client({ region: REGION });
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: "public-read", // if your bucket policy allows public read, otherwise remove
    });

    const url = await getSignedUrl(client, command, { expiresIn: 60 * 5 });

    return NextResponse.json({ url, key, publicUrl: publicUrlForKey(key) });
  } catch (e: any) {
    console.error("presign error", e);
    return NextResponse.json(
      { error: e.message ?? "Internal error" },
      { status: 500 },
    );
  }
}
