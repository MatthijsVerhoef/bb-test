"use client";
import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconMessageCircle,
  IconBookmarkEdit,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconBlockquote,
  IconSearch,
  IconSettings,
  IconUsers,
  IconWheel,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useAuth, useAuthStore } from "@/stores/auth.store";
import { NavDocuments } from "./nav-documents";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: IconChartBar,
    },
    {
      title: "Verhuringen",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Aanhangers",
      url: "#",
      icon: IconWheel,
    },
    {
      title: "Gebruikers",
      url: "#",
      icon: IconUsersGroup,
    },
    {
      title: "Team",
      url: "#",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Instellingen",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Zoeken",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Blog",
      url: "#",
      icon: IconBlockquote,
    },
    {
      name: "Nieuwsbrief",
      url: "#",
      icon: IconBookmarkEdit,
    },
    {
      name: "Support",
      url: "#",
      icon: IconMessageCircle,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, loading, initialized } = useAuth();
  const authStore = useAuthStore();

  React.useEffect(() => {
    if (!initialized) {
      authStore.actions.initializeAuth();
    }
  }, [initialized, authStore.actions]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">BuurBak.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {/* ✅ Better loading state handling */}
        {loading || !initialized ? (
          <div className="flex items-center justify-center p-4">
            <span className="text-sm text-muted-foreground">Laden...</span>
          </div>
        ) : user ? (
          <NavUser user={user} />
        ) : (
          <div className="flex items-center justify-center p-4">
            <span className="text-sm text-muted-foreground">Niet ingelogd</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
