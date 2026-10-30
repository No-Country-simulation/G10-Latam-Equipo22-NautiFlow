import type { UserRole } from './auth.types';

export function roleDashboard(role: UserRole) {
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/owner/dashboard';
}
