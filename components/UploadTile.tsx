"use client";

import { useRef, useState } from "react";

export type UploadTileStatus = "idle" | "uploading" | "success" | "error";

export default function UploadTile({
  prefix,
  onUploaded,
  className,
  label = "Add photo",
}: {
  prefix: string;
  onUploaded?: (_info: { key: string; publicUrl: string }) => void;
  className?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<UploadTileStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(file: File) {
    setStatus("uploading");
    setError(null);
    try {
      const presignRes = await fetch("/api/s3/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, filename: file.name, prefix }),
      });
      const presigned = await presignRes.json();
      if (!presignRes.ok) throw new Error(presigned?.error ?? "Failed to get upload URL");

      const uploadRes = await fetch(presigned.url as string, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      setStatus("success");
      onUploaded?.({ key: presigned.key as string, publicUrl: presigned.publicUrl as string });

      // Reset status after a short delay
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setStatus("error");
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      // Clear error after a few seconds
      setTimeout(() => {
        setError(null);
        setStatus("idle");
      }, 4000);
    } finally {
      if (inputRef.current) inputRef.current.value = ""; // reset file input
    }
  }

  return (
    <div
      className={[
        "relative group aspect-[4/3] overflow-hidden rounded-md border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer select-none",
        className ?? "",
      ].join(" ")}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      {/* Plus icon */}
      <div className="pointer-events-none flex flex-col items-center text-slate-500 dark:text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-10 h-10 opacity-80 group-hover:opacity-100"
        >
          <path d="M11 11V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6z" />
        </svg>
        <span className="mt-1 text-xs">{status === "uploading" ? "Uploading…" : label}</span>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFileSelected(f);
        }}
      />

      {/* Status messages */}
      {status === "success" && (
        <div className="absolute bottom-1 left-1 right-1 text-center text-[11px] px-2 py-1 rounded bg-green-600/90 text-white">
          Uploaded!
        </div>
      )}
      {status === "error" && error && (
        <div className="absolute bottom-1 left-1 right-1 text-center text-[11px] px-2 py-1 rounded bg-red-600/90 text-white">
          {error}
        </div>
      )}
    </div>
  );
}

