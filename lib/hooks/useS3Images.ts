import { useState, useEffect, useCallback } from "react";

type S3Image = { key: string; url: string };
export default function useS3Images(prefix: string) {
  const [images, setImages] = useState<S3Image[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/s3/list?prefix=${encodeURIComponent(prefix)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (res.ok) setImages(data.images as S3Image[]);
    } catch (e) {
      console.error("useS3Images error", e);
    } finally {
      setLoading(false);
    }
  }, [prefix]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/s3/list?prefix=${encodeURIComponent(prefix)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (!cancelled && res.ok) setImages(data.images as S3Image[]);
      } catch (e) {
        console.error("useS3Images error", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prefix]);

  const refresh = useCallback(() => {
    setLoading(true);
    return load();
  }, [load]);

  return { images, loading, refresh } as const;
}

