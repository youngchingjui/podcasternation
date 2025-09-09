export type UploadFolder = "burgers" | "outings";

export type UploadSuccess = {
  ok: true;
  key: string;
  publicUrl: string;
  folder: UploadFolder;
};

export type UploadFailure = {
  ok: false;
  stage: "presign" | "upload";
  error: string;
  code?: string;
  status?: number;
  hint?: string;
  details?: unknown;
};

export async function uploadImageToS3(
  file: File,
  folder: UploadFolder,
): Promise<UploadSuccess | UploadFailure> {
  try {
    const presignRes = await fetch("/api/s3/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: file.type || "application/octet-stream",
        filename: file.name,
        folder,
      }),
    });

    let presignJson: unknown = null;
    try {
      presignJson = await presignRes.json();
    } catch (_err) {
      // swallow JSON parse error and report raw body later
    }

    if (!presignRes.ok) {
      const data = presignJson as
        | { error?: string; code?: string; hint?: string }
        | null;
      return {
        ok: false,
        stage: "presign",
        error: (data && data.error) || `Failed to get upload URL (HTTP ${presignRes.status})`,
        code: data?.code,
        status: presignRes.status,
        hint: data?.hint,
        details: data,
      };
    }

    const { url, publicUrl, key } = presignJson as {
      url: string;
      publicUrl: string;
      key: string;
    };

    const uploadRes = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!uploadRes.ok) {
      // S3 often provides XML error responses; include status info for debugging
      let bodyText: string | undefined;
      try {
        bodyText = await uploadRes.text();
      } catch {
        // ignore
      }
      return {
        ok: false,
        stage: "upload",
        error: `S3 rejected the upload (HTTP ${uploadRes.status}).`,
        status: uploadRes.status,
        hint:
          uploadRes.status === 403
            ? "Check bucket CORS, signed URL expiration, and IAM permissions (s3:PutObject)."
            : uploadRes.status === 400
              ? "Content-Type mismatch or malformed request."
              : undefined,
        details: bodyText,
      };
    }

    return { ok: true, key, publicUrl, folder };
  } catch (e) {
    // Network or unexpected errors
    const msg =
      e instanceof Error ? e.message : "Unexpected error during upload.";
    const isNetwork = msg.toLowerCase().includes("network");
    return {
      ok: false,
      stage: "upload",
      error: msg,
      hint: isNetwork
        ? "Network error — possibly blocked by CORS or offline."
        : undefined,
    };
  }
}

