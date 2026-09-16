import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "./AuthProvider";
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
      <Link href="/">paradict<span>.</span></Link>
      <div>
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
        <main>
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
