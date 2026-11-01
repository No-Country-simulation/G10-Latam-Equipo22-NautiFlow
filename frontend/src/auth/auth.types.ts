export type UserRole = 'ADMIN' | 'OWNER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ownerStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}