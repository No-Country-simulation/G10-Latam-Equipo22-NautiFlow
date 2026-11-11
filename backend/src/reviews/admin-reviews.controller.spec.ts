import { describe, expect, it } from 'vitest';
import { ROLES_KEY } from '../auth/roles.decorator.js';
import { Role } from '../generated/prisma/client.js';
import { AdminReviewsController } from './admin-reviews.controller.js';

function rolesDe(metodo: string) {
  return Reflect.getMetadata(ROLES_KEY, (AdminReviewsController.prototype as never)[metodo]);
}

describe('AdminReviewsController', () => {
  it('restringe las rutas al rol ADMIN a nivel clase', () => {
    const classRoles = Reflect.getMetadata(ROLES_KEY, AdminReviewsController);
    expect(classRoles).toEqual([Role.ADMIN]);
  });
});

