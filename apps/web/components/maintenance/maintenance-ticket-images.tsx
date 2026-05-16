import Image from "next/image";
import { mediaAbsoluteUrl } from "@/lib/domain/entity-image";

type Props = {
  imageUrls?: string[];
  alt: string;
};

export function MaintenanceTicketImages({ imageUrls, alt }: Props) {
  if (!imageUrls?.length) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {imageUrls.map((path) => {
        const src = mediaAbsoluteUrl(path);
        if (!src) return null;
        return (
          <li key={path}>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border border-[var(--ap-border)]"
            >
              <Image
                src={src}
                alt={alt}
                width={96}
                height={96}
                className="h-24 w-24 object-cover"
                unoptimized
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
