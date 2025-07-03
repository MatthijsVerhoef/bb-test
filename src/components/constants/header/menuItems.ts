import { UserRound, MessageCircle, Heart, FileText } from "lucide-react";

export const menuItems = {
  authenticated: [
    {
      href: "/profiel",
      icon: UserRound,
      labelKey: "header.profile",
    },
    {
      href: "/chat",
      icon: MessageCircle,
      labelKey: "header.chat",
    },
    {
      href: "/profiel?tab=favorites",
      icon: Heart,
      labelKey: "Favorieten",
    },
    {
      href: "/profiel?tab=rentals",
      icon: FileText,
      labelKey: "Mijn huurovereenkomsten",
    },
  ],
  general: [
    {
      href: "/verhuren",
      label: "Ik wil verhuren",
      svgPath: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    },
    {
      href: "/contact",
      label: "Hoe het werkt",
      svgPath: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      href: "/blogs",
      label: "Blogs",
      svgPath: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
    },
    {
      href: "/contact",
      label: "Contact",
      svgPath: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    },
  ],
};