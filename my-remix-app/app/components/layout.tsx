import * as React from "react";
import { Link, useLocation } from "@remix-run/react";
import {
  Home,
  Users,
  Settings,
  BarChart3,
  FileText,
  Package,
  ShoppingCart,
  User,
  ChevronDown,
  Database,
  FolderOpen,
  Calendar,
  Mail,
  Banknote,
  MessageCircle,
  Activity,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  const collapsibleNavigation = [
    {
      title: "Support",
      icon: Database,
      items: [
        {
          title: "Intercom",
          url: "/support/intercom",
          icon: Users,
        },
        {
          title: "Submit Request",
          url: "/support/submit-request",
          icon: MessageCircle,
        },
        {
          title: "User List",
          url: "/support/user-list",
          icon: User,
        },
        {
          title: "User Activity",
          url: "/support/user-activity",
          icon: Activity,
        },
      ],
    },
    {
      title: "Verification",
      icon: FolderOpen,
      items: [
        {
          title: "Recharge",
          url: "/verification/recharge",
          icon: FileText,
        },
        {
          title: "Redeem",
          url: "/verification/redeem",
          icon: Package,
        },
      ],
    },
    {
      title: "Operations",
      icon: Package,
      items: [
        {
          title: "Recharge",
          url: "/operations/recharge",
          icon: FileText,
        },
        {
          title: "Redeem",
          url: "/operations/redeem",
          icon: Package,
        },
      ],
    },
    {
      title: "Finance",
      icon: Banknote,
      items: [
        {
          title: "Recharge Queue",
          url: "/finance/recharge-queue",
          icon: FileText,
        },
        {
          title: "Redeem Queue",
          url: "/finance/redeem-queue",
          icon: Package,
        },
        {
          title: "Tag List",
          url: "/finance/tag-list",
          icon: FileText,
        },
      ],
    },
  ];

  const secondaryNavigation = [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-4 w-4" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {collapsibleNavigation.map((group) => (
                  <SidebarMenuItem key={group.title}>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <group.icon className="h-4 w-4" />
                          <span>{group.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {group.items.map((item) => (
                            <SidebarMenuSubItem key={item.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={location.pathname === item.url}
                              >
                                <Link to={item.url}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {secondaryNavigation.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-medium">John Doe</div>
              <div className="text-xs text-muted-foreground">
                john@example.com
              </div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {/* <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-2">
            <h1 className="text-lg font-semibold">
              {collapsibleNavigation.find(
                (item) => item.url === location.pathname
              )?.title ||
                secondaryNavigation.find(
                  (item) => item.url === location.pathname
                )?.title ||
                collapsibleNavigation
                  .flatMap((group) => group.items)
                  .find((item) => item.url === location.pathname)?.title ||
                "Dashboard"}
            </h1>
          </div>
        </header> */}
        <div className=" gap-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
