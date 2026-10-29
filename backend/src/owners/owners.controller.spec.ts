import { ROLES_KEY } from '../auth/roles.decorator.js';
import { Role } from '../generated/prisma/client.js';
import { OwnersController } from './owners.controller.js';

function rolesDe(metodo: string) {
  return Reflect.getMetadata(ROLES_KEY, (OwnersController.prototype as never)[metodo]);
}

describe('OwnersController', () => {
  it('restringe la solicitud y su reapertura al rol OWNER', () => {
    expect(rolesDe('getMyRequest')).toEqual([Role.OWNER]);
    expect(rolesDe('reopenMyRequest')).toEqual([Role.OWNER]);
  });
});
