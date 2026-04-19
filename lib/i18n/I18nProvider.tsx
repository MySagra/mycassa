"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang") || "it";
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
    setMounted(true);

    const handleLanguageChange = (lng: string) => {
      localStorage.setItem("app_lang", lng);
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
