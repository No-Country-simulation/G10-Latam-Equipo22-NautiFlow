import { ROLES_KEY } from '../auth/roles.decorator.js';
import { Role } from '../generated/prisma/client.js';
import { BoatsController } from './boats.controller.js';

function rolesDe(metodo: string) {
  return Reflect.getMetadata(ROLES_KEY, (BoatsController.prototype as never)[metodo]);
}

describe('BoatsController', () => {
  it('restringe el listado del admin al rol ADMIN', () => {
    expect(rolesDe('listApproved')).toEqual([Role.ADMIN]);
  });

  it('restringe las rutas del propietario al rol OWNER', () => {
    expect(rolesDe('listMine')).toEqual([Role.OWNER]);
    expect(rolesDe('create')).toEqual([Role.OWNER]);
    expect(rolesDe('getMine')).toEqual([Role.OWNER]);
    expect(rolesDe('update')).toEqual([Role.OWNER]);
  });
});
