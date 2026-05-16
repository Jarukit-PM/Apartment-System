import type { ActionState } from "@/lib/actions/portal";
import type { FetchOutcome } from "@/lib/api/server";
import { MAX_MAINTENANCE_IMAGES } from "@/lib/domain/maintenance-categories";

type MediaUploadResponse = { data: { url: string } };

type UploadFn = (file: Blob, filename: string) => Promise<FetchOutcome<MediaUploadResponse>>;

function fail(msg: string): ActionState {
  return { ok: false, message: msg };
}

/** Uploads all `images` entries from a form; skips empty file inputs. */
export async function uploadMaintenanceImagesFromForm(
  formData: FormData,
  upload: UploadFn,
): Promise<string[] | ActionState> {
  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > MAX_MAINTENANCE_IMAGES) {
    return fail(`You can attach at most ${MAX_MAINTENANCE_IMAGES} images.`);
  }

  const urls: string[] = [];
  for (const file of files) {
    const res = await upload(file, file.name || "upload.jpg");
    if (!res.ok) {
      return fail(res.error?.message ?? "Could not upload image");
    }
    urls.push(res.data.data.url);
  }
  return urls;
}
