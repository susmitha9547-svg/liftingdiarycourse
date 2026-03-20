"use client";

import dynamic from "next/dynamic";

export const ThemeSwitcherClient = dynamic(
  () => import("@/components/theme-switcher").then((m) => m.ThemeSwitcher),
  { ssr: false }
);
