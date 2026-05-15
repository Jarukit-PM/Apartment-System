import { setRequestLocale } from "next-intl/server";
import { HomeHero } from "@/components/home-hero";
import en from "@/messages/en.json";
import th from "@/messages/th.json";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="ap-ambient-bg">
      <HomeHero initialLocale={locale} copy={{ en: en.HomePage, th: th.HomePage }} />
    </div>
  );
}
