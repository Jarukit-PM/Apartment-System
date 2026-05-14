import { setRequestLocale } from "next-intl/server";
import { HomePageContent } from "@/components/home-page-content";
import en from "@/messages/en.json";
import th from "@/messages/th.json";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <HomePageContent initialLocale={locale} copy={{ en: en.HomePage, th: th.HomePage }} />
      </main>
    </div>
  );
}
