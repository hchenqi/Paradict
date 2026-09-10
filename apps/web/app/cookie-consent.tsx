"use client";

import { useEffect, useState } from "react";

const consentKey = "paradict-cookie-consent";
const euRegions = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
  "IS",
  "LI",
  "NO",
]);

function isLikelyEuVisitor() {
  const region = new Intl.Locale(navigator.language).region;
  return Boolean(region && euRegions.has(region));
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLikelyEuVisitor() && !window.localStorage.getItem(consentKey))
      setVisible(true);
  }, []);

  if (!visible) return null;
  return (
    <aside className="cookie-notice" role="dialog" aria-label="Cookie notice">
      <div>
        <strong>Essential cookies only</strong>
        <p>
          Paradict uses a session cookie only when you sign in. It keeps your
          account secure; no advertising or tracking cookies are used.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(consentKey, "acknowledged");
          setVisible(false);
        }}
      >
        Continue
      </button>
    </aside>
  );
}
