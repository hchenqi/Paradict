import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "./cookie-consent";

export const metadata: Metadata = {
  title: "Paradict",
  description:
    "Multilingual dictionary app built around concepts and moderated edits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
