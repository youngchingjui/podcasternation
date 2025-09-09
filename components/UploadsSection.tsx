"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { uploadImageToS3, type UploadFolder } from "@/lib/s3Upload";

const folderToPrefix: Record<UploadFolder, string> = {
  burgers: "public/burgers/",
  outings: "public/outings/",
};

export default function UploadsSection() {
  const [images, setImages] = useState<Array<{ key: string; url: string }>>([]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "error" | "success"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [folder, setFolder] = useState<UploadFolder>("burgers");

  const prefix = useMemo(() => folderToPrefix[folder], [folder]);

  async function fetchImages() {
    try {
      const res = await fetch(`/api/s3/list?prefix=${encodeURIComponent(prefix)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) setImages(data.images);
    } catch (e) {
      console.error("fetchImages error", e);
    }
  }

  useEffect(() => {
    void fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix]);

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    setError(null);
    setDetails(null);
    try {
      const res = await uploadImageToS3(file, folder);
      if (!res.ok) {
        setStatus("error");
        setError(res.error);
        const extra: string[] = [];
        if (res.code) extra.push(`code: ${res.code}`);
        if (res.status) extra.push(`status: ${res.status}`);
        if (res.hint) extra.push(`hint: ${res.hint}`);
        if (extra.length) setDetails(extra.join(" | "));
        return;
      }
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
        Choose an image and a destination folder to upload directly to S3. We&apos;ll show the most
        recent ones below.
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="folder" className="text-sm">Folder:</label>
          <select
            id="folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value as UploadFolder)}
            className="text-sm border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 bg-transparent"
          >
            <option value="burgers">burgers</option>
            <option value="outings">outings</option>
          </select>
        </div>
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
          {status === "uploading" ? "Uploading..." : `Upload to ${folder}`}
        </button>
        {error && (
          <div className="text-xs text-red-500">
            <span>{error}</span>
            {details && <span className="block text-[10px] opacity-80 mt-0.5">{details}</span>}
          </div>
        )}
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
          <p className="text-sm text-slate-500">No uploads yet in {folder}.</p>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Note: Ensure your S3 bucket CORS allows PUT from this origin and objects are publicly
        viewable or served via a CDN.
      </p>
    </section>
  );
}

