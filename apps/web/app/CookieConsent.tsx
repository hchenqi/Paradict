"use client";

import { useEffect, useState } from "react";
import "./CookieConsent.css";

export default function () {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);

  function hideNotice() {
    localStorage.setItem("cookie-consent", "acknowledged");
    setVisible(false);
  };

  useEffect(() => {
    const acknowledged = localStorage.getItem("cookie-consent");
    if (acknowledged) {
      return;
    }

    setVisible(true);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          hideNotice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <aside className="cookie-notice" role="dialog" aria-label="Cookie notice">
      <div>
        <strong>Essential cookies only</strong>
        <p>This website uses essential authentication cookies when you sign in. No advertising or tracking cookies are used.</p>
      </div>
      <button type="button" onClick={hideNotice}>Continue ({countdown}s)</button>
    </aside>
  );
}
