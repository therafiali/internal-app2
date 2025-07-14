import React from "react";
import { useAuth } from "~/hooks/use-auth";
import Unauthorized from "./unauthorized";
import { canAccessDepartment, Department, UserRole } from "~/lib/access-policies";

interface PrivateRouteProps {
  department: Department;
  children: React.ReactNode;
}

export default function PrivateRoute({ department, children }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  // Assume user role is stored in user_metadata.role
  const role = user?.user_metadata?.role as UserRole | undefined;

  if (loading) return null; // Or a loading spinner
  if (!user || !canAccessDepartment(role, department)) {
    return <Unauthorized />;
  }
  return <>{children}</>;
}
