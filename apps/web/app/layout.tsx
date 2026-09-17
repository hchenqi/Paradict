import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "./AuthProvider";
import { LanguageProvider } from "./LanguageProvider";
import { ExploreProvider } from "./ExploreProvider";
import AuthStatus from "./AuthStatus";
import SelectionSearch from "./SelectionSearch";
import CookieConsent from "./CookieConsent";
import "./layout.css";

export const metadata: Metadata = {
  title: "Paradict",
  description: "A multilingual dictionary built around language-neutral concepts.",
};

function Header() {
  return (
    <header>
      <Link className="brand" href="/">paradict<span>.</span></Link>
      <div className="action">
        <Link href="/submissions">Submissions</Link>
        <AuthStatus />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <span>Paradict / your multilingual dictionary</span>
      <nav>
        <Link href="/about">About</Link>
        <Link href="/impressum">Impressum</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </footer>
  );
}

export default function ({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          <LanguageProvider>
            <ExploreProvider>
              {children}
            </ExploreProvider>
          </LanguageProvider>
        </AuthProvider>
        <Footer />
        <SelectionSearch />
        <CookieConsent />
      </body>
    </html>
  );
}
