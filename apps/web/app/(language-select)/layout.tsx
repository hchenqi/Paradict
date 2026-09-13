"use client";

import { ActiveLanguagesProvider } from "./ActiveLanguagesProvider";
import LanguageSelect from "./LanguageSelect";
import "./layout.css";

export default function ({ children }: { children: React.ReactNode }) {
  return (
    <ActiveLanguagesProvider>
      <LanguageSelect />
      {children}
    </ActiveLanguagesProvider>
  );
}
