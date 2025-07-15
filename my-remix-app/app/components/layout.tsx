import * as React from "react";
import { Link, useLocation } from "@remix-run/react";
import {
  Users,
  Settings,
  FileText,
  Package,
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
import { useAuth } from "~/hooks/use-auth";
import { canAccessDepartment, UserRole, Department } from "~/lib/access-policies";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.user_metadata?.role as UserRole | undefined;
  const department = user?.user_metadata?.department as Department | undefined;

  // Map group titles to section keys
  const groupSectionMap: Record<string, Department> = {
    Support: "support",
    Verification: "verification",
    Operations: "operation",
    Finance: "finance",
  };

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
          url: "/support/userlist",
          icon: User,
        },
        {
          title: "User Activity",
          url: "/support/useractivity/recharge",
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

  const userName = user?.user_metadata?.full_name;
  const userEmail = user?.email;

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          {/* Logo Section */}
          <div className="h-16 flex items-center px-6 border-b border-gray-800/20 py-12">
            <Link
              to="/"
              className="text-md font-bold text-white flex items-center gap-2"
            >
              <img src="/logo.png" alt="Logo" width={40} height={40} />
              <span className="text-md font-bold text-white">
                Techmile Solutions
              </span>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {collapsibleNavigation.map((group) =>
                  canAccessDepartment(role, groupSectionMap[group.title]) ? (
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
                  ) : null
                )}
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
              <div className="text-sm font-medium">
                {userName || userEmail}
              </div>
              <div className="text-xs capitalize text-muted-foreground">
                {role} ● {department}
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
        <div className="gap-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
