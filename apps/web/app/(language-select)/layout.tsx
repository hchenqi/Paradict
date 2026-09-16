"use client";

import { LanguageProvider } from "./LanguageProvider";
import LanguageSelect from "./LanguageSelect";
import "./layout.css";

export default function ({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <LanguageSelect />
      <main>{children}</main>
    </LanguageProvider>
  );
}
