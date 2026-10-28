import { ROLES_KEY } from '../auth/roles.decorator.js';
import { Role } from '../generated/prisma/client.js';
import { ZonesController } from './zones.controller.js';

function rolesDe(metodo: string) {
  return Reflect.getMetadata(ROLES_KEY, (ZonesController.prototype as never)[metodo]);
}

describe('ZonesController', () => {
  it('mantiene el listado público sin roles requeridos', () => {
    expect(rolesDe('listActive')).toBeUndefined();
  });

  it('restringe el CRUD de zonas al rol ADMIN', () => {
    expect(rolesDe('listAll')).toEqual([Role.ADMIN]);
    expect(rolesDe('create')).toEqual([Role.ADMIN]);
    expect(rolesDe('update')).toEqual([Role.ADMIN]);
    expect(rolesDe('deactivate')).toEqual([Role.ADMIN]);
  });
});
