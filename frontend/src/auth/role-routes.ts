import type { UserRole } from './auth.types';

export function roleDashboard(role: UserRole) {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'CLIENT') return '/client/dashboard';
  return '/owner/dashboard';
}