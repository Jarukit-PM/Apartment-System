"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { HomePageContent } from "@/components/home-page-content";
import { routing } from "@/i18n/routing";

gsap.registerPlugin(useGSAP);

type HomeCopy = {
  brand: string;
  heading: string;
  intro: string;
  language: string;
  openConsole: string;
  myPortal: string;
  signIn: string;
};

type Locale = (typeof routing.locales)[number];

type Props = {
  initialLocale: string;
  copy: Record<Locale, HomeCopy>;
};

export function HomeHero({ initialLocale, copy }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero='eyebrow']", { opacity: 0, y: 16, duration: 0.6 })
        .from("[data-hero='title']", { opacity: 0, y: 28, duration: 0.75 }, "-=0.35")
        .from("[data-hero='intro']", { opacity: 0, y: 20, duration: 0.6 }, "-=0.4")
        .from("[data-hero='actions']", { opacity: 0, y: 24, duration: 0.65 }, "-=0.3")
        .from("[data-hero='card']", { opacity: 0, y: 20, scale: 0.98, duration: 0.7 }, "-=0.5");
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="flex min-h-dvh flex-col items-center justify-center px-6 py-20">
      <div
        data-hero="card"
        className="ap-glass-elevated w-full max-w-lg rounded-[var(--ap-radius-lg)] p-8 md:p-10"
      >
        <HomePageContent initialLocale={initialLocale} copy={copy} hero />
      </div>
    </div>
  );
}
