import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

function publicUrlForKey(key: string) {
  if (PUBLIC_BASE) return `${PUBLIC_BASE.replace(/\/$/, "")}/${key}`;
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export async function GET(_req: NextRequest) {
  try {
    assertEnv();
    const client = new S3Client({ region: REGION });
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: PREFIX,
      MaxKeys: 30,
    });
    const res = await client.send(command);
    const items = (res.Contents ?? [])
      .filter((obj) => obj.Key && !obj.Key.endsWith("/"))
      .sort(
        (a, b) =>
          (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0),
      )
      .slice(0, 24)
      .map((obj) => ({
        key: obj.Key!,
        url: publicUrlForKey(obj.Key!),
        size: obj.Size ?? 0,
        lastModified: obj.LastModified?.toISOString() ?? null,
        etag: obj.ETag ?? null,
      }));
    return NextResponse.json({ images: items });
  } catch (e: any) {
    console.error("list error", e);
    return NextResponse.json(
      { error: e.message ?? "Internal error" },
      { status: 500 },
    );
  }
}
