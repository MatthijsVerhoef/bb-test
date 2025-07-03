import Link from "next/link";
import { useTranslation } from "@/lib/i18n/client";

export const NavigationLinks = ({ scrolled }: { scrolled: boolean }) => {
  const { t } = useTranslation();

  if (scrolled) return null;

  return (
    <div className="hidden md:flex items-center gap-x-6 md:gap-x-14 absolute left-1/2 -translate-x-1/2 text-[15px] font-medium transition-all duration-300 top-[18px] z-20">
      <Link href="/verhuren" className="hover:text-primary transition-colors">
        {t("header.addTrailer")}
      </Link>
      <Link href="/contact" className="hover:text-primary transition-colors">
        Hoe het werkt
      </Link>
      <Link href="/blogs" className="hover:text-primary transition-colors">
        Blogs
      </Link>
      <Link href="/contact" className="hover:text-primary transition-colors">
        Contact
      </Link>
    </div>
  );
};
