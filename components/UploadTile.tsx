"use client";

import { useRef, useState } from "react";
import { uploadImageToS3, type UploadFolder } from "@/lib/s3Upload";

type Status = "idle" | "uploading" | "success" | "error";

export default function UploadTile({
  folder,
  onUploaded,
  className = "",
}: {
  folder: UploadFolder;
  onUploaded?: (_: { key: string; publicUrl: string; folder: UploadFolder }) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);

  function pickFile() {
    setError(null);
    setDetails(null);
    inputRef.current?.click();
  }

  async function onFileChange(file: File | null) {
    if (!file) return;
    setStatus("uploading");
    setError(null);
    setDetails(null);

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
    onUploaded?.({ key: res.key, publicUrl: res.publicUrl, folder: res.folder });
    // reset success state after a short delay
    setTimeout(() => setStatus("idle"), 1200);
  }

  return (
    <button
      type="button"
      onClick={pickFile}
      aria-label={`Upload photo to ${folder}`}
      className={`aspect-[4/3] rounded-md border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
        status === "error" ? "border-red-400 text-red-500" : ""
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      {status === "uploading" && (
        <span className="text-sm animate-pulse">Uploading...</span>
      )}
      {status === "success" && (
        <span className="text-sm text-green-600">Uploaded!</span>
      )}
      {status === "idle" && (
        <div className="flex flex-col items-center gap-1 select-none">
          <div className="w-9 h-9 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <span className="text-xl leading-none">+</span>
          </div>
          <span className="text-xs">Add photo</span>
        </div>
      )}
      {status === "error" && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium">Upload failed</span>
          {error && <span className="text-[10px] opacity-80 text-red-500 text-center px-2">{error}</span>}
          {details && (
            <span className="text-[10px] opacity-60 text-red-500 text-center px-2">{details}</span>
          )}
          <span className="text-[10px] opacity-70">Tap to retry</span>
        </div>
      )}
    </button>
  );
}

