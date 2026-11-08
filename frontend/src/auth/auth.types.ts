export type UserRole = 'ADMIN' | 'OWNER' | 'CLIENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ownerStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}