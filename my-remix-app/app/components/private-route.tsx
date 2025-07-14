import React from "react";
import { useAuth } from "~/hooks/use-auth";
import Unauthorized from "./unauthorized";
import { canAccessSection, Section, UserRole } from "~/lib/access-policies";

interface PrivateRouteProps {
  section: Section;
  children: React.ReactNode;
}

export default function PrivateRoute({ section, children }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  // Assume user role is stored in user_metadata.role
  const role = user?.user_metadata?.role as UserRole | undefined;

  if (loading) return null; // Or a loading spinner
  if (!user || !canAccessSection(role, section)) {
    return <Unauthorized />;
  }
  return <>{children}</>;
}
