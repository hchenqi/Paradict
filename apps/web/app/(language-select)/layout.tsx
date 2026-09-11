"use client";

import { ActiveLanguageListProvider } from "./ActiveLanguageListProvider";
import LanguageSelector from "./LanguageSelector";

export default function ({ children }: { children: React.ReactNode; }) {
  return (
    <ActiveLanguageListProvider>
      <LanguageSelector />
      {children}
    </ActiveLanguageListProvider>
  );
}
