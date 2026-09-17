"use client";

import LanguageSelect from "./LanguageSelect";
import "./layout.css";

export default function ({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LanguageSelect />
      <main>{children}</main>
    </>
  );
}
