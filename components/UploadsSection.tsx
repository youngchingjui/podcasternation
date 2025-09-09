"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function UploadsSection() {
  const [images, setImages] = useState<Array<{ key: string; url: string }>>([]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "error" | "success"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  async function fetchImages() {
    try {
      const res = await fetch("/api/s3/list", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setImages(data.images);
    } catch (e) {
      console.error("fetchImages error", e);
    }
  }

  useEffect(() => {
    void fetchImages();
  }, []);

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    setError(null);
    try {
      const presignRes = await fetch("/api/s3/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, filename: file.name }),
      });
      const { url } = await presignRes.json();
      if (!presignRes.ok) throw new Error("Failed to get upload URL");

      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      setStatus("success");
      setFile(null);
      await fetchImages();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <section id="uploads" className="flex flex-col gap-6">
      <h2 className="text-3xl font-semibold">Your uploads (S3)</h2>
      <p className="text-slate-600 dark:text-slate-300">
        Choose an image to upload directly to S3. We&apos;ll show the most
        recent ones below.
      </p>
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          onClick={() => void handleUpload()}
          disabled={!file || status === "uploading"}
          className="text-sm px-3 py-1.5 rounded-md bg-foreground text-background disabled:opacity-50"
        >
          {status === "uploading" ? "Uploading..." : "Upload to S3"}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img) => (
          <div
            key={img.key}
            className="aspect-[4/3] overflow-hidden rounded-md"
          >
            <Image
              src={img.url}
              alt={img.key}
              className="w-full h-full object-cover"
              width={1000}
              height={1000}
            />
          </div>
        ))}
        {images.length === 0 && (
          <p className="text-sm text-slate-500">No uploads yet.</p>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Note: Make sure your S3 bucket CORS allows PUT from this origin and
        objects are publicly viewable or served via a CDN.
      </p>
    </section>
  );
}
