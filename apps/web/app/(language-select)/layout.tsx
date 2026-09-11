"use client";

import { ActiveLanguageListProvider } from "./ActiveLanguageListProvider";
import LanguageSelect from "./LanguageSelect";

export default function LanguageSelectLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveLanguageListProvider>
      <LanguageSelect />
      {children}
    </ActiveLanguageListProvider>
  );
}
