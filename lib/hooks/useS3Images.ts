import { useState, useEffect } from "react";

type S3Image = { key: string; url: string };
export default function useS3Images(prefix: string) {
  const [images, setImages] = useState<S3Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/s3/list?prefix=${encodeURIComponent(prefix)}`,
        );
        const data = await res.json();
        if (!cancelled && res.ok) setImages(data.images as S3Image[]);
      } catch (e) {
        console.error("useS3Images error", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [prefix, version]);

  function reload() {
    setVersion((v) => v + 1);
  }

  return { images, loading, reload } as const;
}

