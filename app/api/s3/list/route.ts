import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET_NAME;
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL; // e.g. https://cdn.example.com or https://my-bucket.s3.us-east-1.amazonaws.com
const DEFAULT_PREFIX = process.env.S3_UPLOAD_PREFIX ?? "uploads/";

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

function sanitizePrefix(prefix: string | null): string {
  // prevent directory traversal or absolute paths
  const p = (prefix ?? DEFAULT_PREFIX).replace(/\\/g, "/");
  if (p.startsWith("/") || p.includes("..")) return DEFAULT_PREFIX;
  return p;
}

export async function GET(req: NextRequest) {
  try {
    assertEnv();
    const prefix = sanitizePrefix(req.nextUrl.searchParams.get("prefix"));
    const client = new S3Client({ region: REGION });
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: 60,
    });
    const res = await client.send(command);
    const items = (res.Contents ?? [])
      .filter((obj) => obj.Key && !obj.Key.endsWith("/"))
      .sort(
        (a, b) =>
          (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0),
      )
      .slice(0, 32)
      .map((obj) => ({
        key: obj.Key!,
        url: publicUrlForKey(obj.Key!),
        size: obj.Size ?? 0,
        lastModified: obj.LastModified?.toISOString() ?? null,
        etag: obj.ETag ?? null,
      }));
    return NextResponse.json({ images: items, prefix });
  } catch (e) {
    console.error("list error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}

