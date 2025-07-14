// Centralized access policies for roles

export type UserRole = 'admin' | 'operation' | 'support' | 'finance' | 'verification' | 'executive';

// Define which roles can access which sections
type Section = 'support' | 'verification' | 'operation' | 'finance';

const sectionAccess: Record<Section, UserRole[]> = {
  support: ['admin', 'executive', 'support'],
  verification: ['admin', 'executive', 'verification'],
  operation: ['admin', 'executive', 'operation'],
  finance: ['admin', 'executive', 'finance'],
};

export function canAccessSection(role: UserRole | undefined, section: Section): boolean {
  if (!role) return false;
  return sectionAccess[section]?.includes(role) || false;
}

export { Section }; 