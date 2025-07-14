// Centralized access policies for roles

export type UserRole = 'admin' | 'agent' | 'operation' | 'support' | 'finance' | 'verification' | 'executive';

// Define which roles can access which sections
type Department = 'support' | 'verification' | 'operation' | 'finance';

const departmentAccess: Record<Department, UserRole[]> = {
  support: ['admin', 'executive', 'support', 'agent'],
  verification: ['admin', 'executive', 'verification', 'agent'],
  operation: ['admin', 'executive', 'operation', 'agent'],
  finance: ['admin', 'executive', 'finance', 'agent'],

   
};

export function canAccessDepartment(role: UserRole | undefined, department: Department): boolean {
   
  if (!role) return false;
  return departmentAccess[department]?.includes(role) || false;
}

export type { Department }; 