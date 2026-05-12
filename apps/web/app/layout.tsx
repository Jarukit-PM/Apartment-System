import type { ReactNode } from "react";
import "./globals.css";

type Props = {
  children: ReactNode;
};

// Root pass-through; `<html>` and `<body>` live in `app/[locale]/layout.tsx`
// so `lang` matches the active locale (next-intl pattern).
export default function RootLayout({ children }: Props) {
  return children;
}
