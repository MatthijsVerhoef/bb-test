import Link from "next/link";
import { useTranslation } from "@/lib/i18n/client";

interface NavigationLinksProps {
  className?: string;
}

export const NavigationLinks = ({ className }: NavigationLinksProps) => {
  const { t } = useTranslation();

  const links = [
    { href: "/verhuren", label: t("header.addTrailer") },
    { href: "/contact", label: "Hoe het werkt" },
    { href: "/blogs", label: "Blogs" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className={className}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="hover:text-primary transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
};
