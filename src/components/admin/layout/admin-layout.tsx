"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Home,
  CreditCard,
  Settings,
  Bell,
  LogOut,
  Search,
  Menu,
  ChevronDown,
  BarChart3,
  MessageCircle,
  HelpCircle,
  Star,
  X,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    {
      name: "Verhuringen",
      href: "/admin/rentals",
      icon: Calendar,
      badge: "12",
    },
    { name: "Gebruikers", href: "/admin/users", icon: Users },
    { name: "Aanhangwagens", href: "/admin/trailers", icon: Home },
    { name: "Blogs", href: "/admin/blogs", icon: FileText },
    { name: "Betalingen", href: "/admin/payments", icon: CreditCard },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Reviews", href: "/admin/reviews", icon: Star, badge: "3" },
    { name: "Berichten", href: "/admin/messages", icon: MessageCircle },
    { name: "Instellingen", href: "/admin/settings", icon: Settings },
  ];

  const NavLink = ({ item, onClick }: { item: any; onClick?: () => void }) => {
    const isActive =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
          isActive
            ? "bg-gray-900 text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1">{item.name}</span>
        {item.badge && (
          <Badge
            variant="secondary"
            className={cn(
              "h-5 px-1.5 text-xs",
              isActive ? "bg-white/20 text-white" : "bg-gray-100"
            )}
          >
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">BuurBak</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
              isSearchFocused ? "text-gray-900" : "text-gray-400"
            )}
          />
          <Input
            type="search"
            placeholder="Zoeken..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="pl-10 h-10 bg-gray-50 border-0 rounded-lg placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200"
          />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-1 pb-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              item={item}
              onClick={() => setIsSidebarOpen(false)}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Help Section */}
      <div className="px-4 pb-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 bg-gray-200 rounded-lg flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-gray-600" />
            </div>
            <h4 className="font-medium text-sm text-gray-900">Hulp nodig?</h4>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Bekijk onze documentatie of neem contact op met support.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8 border-gray-200"
          >
            Naar support center
          </Button>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-avatar.png" />
                <AvatarFallback className="bg-gray-100 text-xs">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@buurbak.nl</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mijn account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              Profiel
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Accountinstellingen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  // Get current page title
  const currentPage = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const pageTitle = currentPage?.name || "Dashboard";

  return (
    <div className="flex h-screen bg-[#F7F7F7]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Mobile menu & Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                {pageTitle}
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between p-4">
                    <h3 className="font-semibold text-sm">Meldingen</h3>
                    <Badge variant="secondary" className="text-xs">
                      2 nieuw
                    </Badge>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-1 p-2">
                      <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Nieuwe verhuring
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Jan Jansen heeft een aanhangwagen gehuurd
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              2 minuten geleden
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-amber-500 rounded-full mt-1.5"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Review ontvangen
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Nieuwe 5-sterren review voor trailer #1234
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              1 uur geleden
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors opacity-60">
                        <div className="flex items-start gap-3">
                          <div className="h-2 w-2 bg-gray-300 rounded-full mt-1.5"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Betaling ontvangen
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              €125,00 voor verhuring #5678
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              3 uur geleden
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="p-2 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      className="w-full justify-center text-sm"
                    >
                      Alle meldingen bekijken
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu - Desktop */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-avatar.png" />
                      <AvatarFallback className="bg-gray-100 text-xs">
                        AD
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder-avatar.png" />
                      <AvatarFallback className="bg-gray-100 text-sm">
                        AD
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Admin User</p>
                      <p className="text-xs text-gray-500">admin@buurbak.nl</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Users className="mr-2 h-4 w-4" />
                    Profiel bekijken
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Accountinstellingen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto"
          onClick={() => console.log(pathname)}
        >
          <div
            className={`${
              pathname !== "/admin/blogs/editor" && "p-4 sm:p-6 lg:p-8"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
