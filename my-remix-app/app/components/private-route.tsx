import React from "react";
import { useAuth } from "~/hooks/use-auth";
import Unauthorized from "./unauthorized";
import {
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
  const department = user?.user_metadata?.department.toLowerCase() as Department | undefined;
  

  if (loading) return null; // Or a loading spinner
  if (department === 'admin' || department === toDepartment ) {
    return  children 
  }
  return <Unauthorized />;
}
