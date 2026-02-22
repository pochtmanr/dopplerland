"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const t = useTranslations("cookie");

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-4xl rounded-2xl border border-overlay/10 bg-bg-secondary/95 backdrop-blur-lg p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-muted leading-relaxed">
              🍪 {t("message")}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={decline}
              className="px-4 py-2 text-sm text-text-muted hover:text-text-primary border border-overlay/10 rounded-xl transition-colors cursor-pointer"
            >
              {t("decline")}
            </button>
            <button
              onClick={accept}
              className="px-5 py-2 text-sm font-semibold bg-accent-teal text-bg-primary rounded-xl hover:bg-accent-teal/90 transition-colors cursor-pointer"
            >
              {t("accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
