"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP);

type Props = {
  children: ReactNode;
};

export function AuthImmersiveShell({ children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-auth-card]", {
        opacity: 0,
        y: 24,
        scale: 0.98,
        duration: 0.75,
        ease: "power3.out",
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="ap-ambient-bg ap-content-enter flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div data-auth-card className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
