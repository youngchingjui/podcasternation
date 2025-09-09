import useS3Images from "@/lib/hooks/useS3Images";
import Image from "next/image";
import UploadTile from "./UploadTile";

export function GallerySection({
  id,
  title,
  description,
  prefix,
  emptyPlaceholderCount = 0,
  emptyPlaceholderSrc,
}: {
  id: string;
  title: string;
  description?: string;
  prefix: string;
  emptyPlaceholderCount?: number;
  emptyPlaceholderSrc?: string;
}) {
  const { images, loading, reload } = useS3Images(prefix);
  const hasImages = images.length > 0;

  return (
    <section id={id} className="flex flex-col gap-6">
      <h2 className="text-3xl font-semibold">{title}</h2>
      {description && (
        <p className="text-slate-600 dark:text-slate-300">{description}</p>
      )}
      {!hasImages && loading && (
        <p className="text-sm text-slate-500">Loading images...</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {hasImages &&
          images.map((img) => (
            <div
              key={img.key}
              className="aspect-[4/3] overflow-hidden rounded-md"
            >
              <Image
                src={img.url}
                alt={img.key}
                className="w-full h-full object-cover"
                width={1200}
                height={900}
              />
            </div>
          ))}
        {!hasImages &&
          emptyPlaceholderSrc &&
          Array.from({ length: emptyPlaceholderCount }).map((_, i) => (
            <div key={i} className="aspect-[4/3] overflow-hidden rounded-md">
              <Image
                src={emptyPlaceholderSrc}
                alt={`${title} ${i + 1}`}
                className="w-full h-full object-cover"
                width={1200}
                height={900}
              />
            </div>
          ))}
        {!hasImages && !emptyPlaceholderSrc && !loading && (
          <p className="text-sm text-slate-500">No images yet.</p>
        )}
        {/* Reusable upload tile at the end */}
        <UploadTile prefix={prefix} onUploaded={() => reload()} />
      </div>
    </section>
  );
}

