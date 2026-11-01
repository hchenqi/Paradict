import React from "react";
import { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { AuthProvider } from "./AuthProvider";
import { LanguageProvider } from "./LanguageProvider";
import { ExploreProvider } from "./ExploreProvider";
import AuthStatus from "./AuthStatus";
import SelectionSearch from "./SelectionSearch";
import CookieConsent from "./CookieConsent";
import "./layout.css";
import "./Concept.css";

export const metadata: Metadata = {
  title: "Paradict",
  description: "A multilingual dictionary built around language-neutral concepts.",
};

function Header() {
  return (
    <header>
      <Link className="brand" href="/">paradict<span>.</span></Link>
      <div className="action">
        <Link href="/submissions">submissions</Link>
        <AuthStatus />
      </div>
    </header>
  );
}

async function Footer() {
  const country = (await headers()).get("x-vercel-ip-country");
  const showLegalNotice = !country || country === "DE";

  return (
    <footer>
      <span>Paradict / your multilingual dictionary</span>
      <nav aria-label="Footer navigation">
        <Link href="/about">About</Link>
        <Link href="/terms">Terms and Conditions</Link>
        <Link href="/privacy">Privacy Policy</Link>
        {showLegalNotice && <Link href="/impressum">Legal Notice</Link>}
        <Link href="/contact">Contact</Link>
      </nav>
    </footer>
  );
}

export default function ({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <Header />
            <ExploreProvider>
              {children}
            </ExploreProvider>
          </AuthProvider>
          <Footer />
          <CookieConsent />
          <SelectionSearch />
        </LanguageProvider>
      </body>
    </html>
  );
}
