import { redirect } from "next/navigation";
import { isSafeAppPath } from "@/lib/auth/url-guards";

type PageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

/** Legacy `/login` URL — home is the sign-in page. */
export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.next && isSafeAppPath(sp.next)) {
    qs.set("next", sp.next);
  }
  if (sp.error) {
    qs.set("error", sp.error);
  }
  const suffix = qs.toString();
  redirect(suffix ? `/?${suffix}` : "/");
}
