import { resolvePropertyImageSrc, resolveUnitImageSrc } from "@/lib/domain/entity-image";

type EntityImageProps = {
  src: string;
  alt: string;
  className?: string;
  aspect?: "video" | "square";
};

export function EntityImage({ src, alt, className = "", aspect = "video" }: EntityImageProps) {
  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-[16/10]";
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[var(--ap-border)] bg-[#f5f2eb] ${aspectClass} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
    </div>
  );
}

type PropertyImageProps = {
  name: string;
  imageUrl?: string | null;
  className?: string;
  aspect?: "video" | "square";
};

export function PropertyImage({ name, imageUrl, className, aspect }: PropertyImageProps) {
  return (
    <EntityImage
      src={resolvePropertyImageSrc(imageUrl)}
      alt={name}
      className={className}
      aspect={aspect}
    />
  );
}

type UnitImageProps = {
  label: string;
  imageUrl?: string | null;
  propertyImageUrl?: string | null;
  className?: string;
  aspect?: "video" | "square";
};

export function UnitImage({
  label,
  imageUrl,
  propertyImageUrl,
  className,
  aspect,
}: UnitImageProps) {
  return (
    <EntityImage
      src={resolveUnitImageSrc(imageUrl, propertyImageUrl)}
      alt={label}
      className={className}
      aspect={aspect}
    />
  );
}
