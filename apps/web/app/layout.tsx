import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "./AuthProvider";
import AuthStatus from "./AuthStatus";
import SelectionSearch from "./SelectionSearch";
import CookieConsent from "./CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paradict",
  description: "A multilingual dictionary built around language-neutral concepts.",
};

function Header() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        paradict<span>.</span>
      </Link>
      <div className="topbar-actions">
        <Link className="back-link" href="/submissions">
          Submissions
        </Link>
        <AuthStatus />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <span>Paradict / your multilingual dictionary</span>
      <span>
        <Link href="/about">About</Link> ·{" "}
        <Link href="/impressum">Impressum</Link> ·{" "}
        <Link href="/contact">Contact</Link>
      </span>
    </footer>
  );
}

export default function ({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body>
        <main className="shell">
          <AuthProvider>
            <Header />
            {children}
          </AuthProvider>
          <Footer />
          <SelectionSearch />
        </main>
        <CookieConsent />
      </body>
    </html>
  );
}
