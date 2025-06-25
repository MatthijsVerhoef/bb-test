"use client";

import FeedbackForm from "./feedback-form";
import { useTranslation } from "@/lib/i18n/client";
import Link from "next/link";

const Footer = () => {
  const { t } = useTranslation("common");

  return (
    <div className="py-3 hidden md:flex items-center w-full border-t bg-white z-50 fixed bottom-0 start-0 px-12 px:lg-0">
      <div className="w-7xl mx-auto text-[13px] flex items-center">
        <p>© 2025 BuurBak.</p>
        <span className="mx-2">•</span>

        <Link
          href="/privacy"
          className="cursor-pointer transition hover:underline"
        >
          {t("footer.privacy")}
        </Link>
        <span className="mx-2">•</span>

        <Link
          href="/terms"
          className="cursor-pointer transition hover:underline"
        >
          {t("footer.terms")}
        </Link>
        <span className="mx-2">•</span>

        <Link
          href="/sitemap"
          className="cursor-pointer transition hover:underline"
        >
          {t("footer.sitemap")}
        </Link>

        <FeedbackForm />
      </div>
    </div>
  );
};

export default Footer;
