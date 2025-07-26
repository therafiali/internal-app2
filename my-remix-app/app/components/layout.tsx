import * as React from "react";
import { Link, useLocation, useNavigate } from "@remix-run/react";
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
  Shield,
  DollarSign,
  ArrowRightLeft,
  Lock,
  UserPlus,
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
import { useAuthContext } from "~/components/auth-provider";
import { Button } from "~/components/ui/button";
import {
  canAccessDepartment,
  UserRole,
  Department,
} from "~/lib/access-policies";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { user, signOut, isAuthenticated } = useAuthContext();
  const role = user?.user_metadata?.role as UserRole | undefined;
  const department = user?.user_metadata?.department?.toLowerCase() as
    | Department
    | undefined;
  const navigate = useNavigate();

  // Map group titles to section keys
  const groupSectionMap: Record<string, Department> = {
    Support: "support",
    Verification: "verification",
    Operations: "operation",
    Finance: "finance",
    Admin: "admin",
  };

  const collapsibleNavigation = [
    {
      title: "Support",
      icon: MessageCircle,
      items: [
        // {
        //   title: "Intercom",
        //   url: "/support/intercom",
        //   icon: Users,
        // },
        {
          title: "User List",
          url: "/support/userlist",
          icon: User,
        },
        {
          title: "User Activity",
          url: "/support/useractivity/recharge/pending",
          icon: Activity,
        },
        {
          title: "Chat",
          url: "/support/chat",
          icon: MessageCircle,
        },
      ],
    },
    {
      title: "Verification",
      icon: Shield,
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
      icon: Settings,
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
        {
          title: "Transfer Request",
          url: "/operations/transfers",
          icon: ArrowRightLeft,
        },
        {
          title: "Reset Password",
          url: "/operations/resetpassword",
          icon: Lock, 
        },
        {
          title: "New Account",
          url: "/operations/account",
          icon: UserPlus,
        },
      ],
    },
    {
      title: "Finance",
      icon: DollarSign,
      items: [
        {
          title: "Recharge Queue",
          url: "/finance/recharge/queue",
          icon: FileText,
        },
        {
          title: "Redeem Queue",
          url: "/finance/redeem/queue",
          icon: Package,
        },
        {
          title: "Tag List",
          url: "/finance/taglist",
          icon: FileText,
        },
      ],
    },
    {
      title: "Admin",
      url: "/config",
      icon: DollarSign,
      items: [
        {
          title: "Config",
          url: "/config",
          icon: FileText,
        },
        {
          title: "Manage Users",
          url: "/",
          icon: Users,
        },
      ],
    },
  ];

  // const secondaryNavigation = [
  //   {
  //     title: "Settings",
  //     url: "/settings",
  //     icon: Settings
  //   },
  //   {
  //     title: "Profile",
  //     url: "/profile",
  //     icon: User,
  //   },
  // ];

  const userName = user?.user_metadata?.full_name;
  const userEmail = user?.email;

  const isAdmin = department === "admin";
  let visibleNavigation = collapsibleNavigation;
  let showGroupLabel = true;
  let defaultOpenGroup: string | null = null;

  if (!isAdmin && department) {
    // Find the group that matches the user's department
    const groupEntry = Object.entries(groupSectionMap).find(
      ([, dept]) => dept === department
    );
    if (groupEntry) {
      visibleNavigation = [
        collapsibleNavigation.find(
          (g) => groupSectionMap[g.title] === department
        )!,
      ];
      showGroupLabel = false;
      defaultOpenGroup = groupEntry[0];
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {user && (
        <Sidebar className="bg-zinc-800" collapsible="icon">
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
              {showGroupLabel && (
                <SidebarGroupLabel>Management</SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleNavigation.map((group) =>
                    canAccessDepartment(
                      department,
                      groupSectionMap[group.title]
                    ) ? (
                      <SidebarMenuItem key={group.title}>
                        {isAdmin ? (
                          <Collapsible defaultOpen={!isAdmin}>
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
                        ) : (
                          // For non-admins, just show the items directly, no collapsible
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
                        )}
                      </SidebarMenuItem>
                    ) : null
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* <SidebarGroup>
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
          </SidebarGroup> */}
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-2 px-2 w-full justify-between">
              <div className="flex items-center gap-2">
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
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate("/auth/signin");
                }}
              >
                Logout
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
      )}
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
