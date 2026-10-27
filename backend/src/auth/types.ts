import type { Request } from 'express';
import type { Role } from '../generated/prisma/client.js';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  ownerStatus: string | null;
};

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };