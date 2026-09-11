import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import CookieConsent from "./CookieConsent";
import AuthStatus from "./AuthStatus";
import SelectionSearch from "./SelectionSearch";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paradict",
  description: "Multilingual dictionary app built around concepts and moderated edits.",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body>
        <main className="shell">
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
          {children}
          <footer>
            <span>Paradict / browse by concept</span>
            <span>
              <Link href="/about">About</Link> ·{" "}
              <Link href="/impressum">Impressum</Link> ·{" "}
              <Link href="/contact">Contact</Link>
            </span>
          </footer>
          <SelectionSearch />
        </main>
        <CookieConsent />
      </body>
    </html>
  );
}
