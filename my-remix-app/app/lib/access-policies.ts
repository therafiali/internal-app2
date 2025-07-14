// Centralized access policies for roles

export type UserRole = 'admin' | 'operation' | 'support' | 'finance' | 'verification' | 'executive';

// Define which roles can access which sections
type Department = 'support' | 'verification' | 'operation' | 'finance';

const departmentAccess: Record<Department, UserRole[]> = {
  support: ['admin', 'executive', 'support'],
  verification: ['admin', 'executive', 'verification', 'agent'],
  operation: ['admin', 'executive', 'operation'],
  finance: ['admin', 'executive', 'finance'],
};

export function canAccessDepartment(role: UserRole | undefined, department: Department): boolean {
  console.log(role, department);
  if (!role) return false;
  return departmentAccess[department]?.includes(role) || false;
}

export type { Department }; 