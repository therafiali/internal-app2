import React from "react";
import { useAuth } from "~/hooks/use-auth";
import Unauthorized from "./unauthorized";
import {
  canAccessDepartment,
  Department,
  UserRole,
} from "~/lib/access-policies";

interface PrivateRouteProps {
  children: React.ReactNode;
  toDepartment: Department;
}

export default function PrivateRoute({
  children,
  toDepartment,
}: PrivateRouteProps) {
  const { user, loading } = useAuth();

  // Assume user role is stored in user_metadata.role
  const role = user?.user_metadata?.role as UserRole | undefined;
  const department = user?.user_metadata?.department as Department | undefined;
  console.log(role, department, " PrivateRoute");

  if (loading) return null; // Or a loading spinner
  if (!user || department !== toDepartment) {
    return <Unauthorized />;
  }
  return <>{children}</>;
}
