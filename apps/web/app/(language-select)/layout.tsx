"use client";

import LanguageSelect from "./LanguageSelect";

export default function ({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LanguageSelect />
      <main>{children}</main>
    </>
  );
}
