import { ROLES_KEY } from '../auth/roles.decorator.js';
import { Role } from '../generated/prisma/client.js';
import { EmptyLegsController } from './empty-legs.controller.js';
import { OwnerEmptyLegsController } from './owner-empty-legs.controller.js';

describe('EmptyLegsController', () => {
  it('restringe la bolsa de tramos al rol ADMIN', () => {
    expect(Reflect.getMetadata(ROLES_KEY, EmptyLegsController)).toEqual([Role.ADMIN]);
  });
});

describe('OwnerEmptyLegsController', () => {
  it('restringe los retornos del lanchero al rol OWNER', () => {
    expect(Reflect.getMetadata(ROLES_KEY, OwnerEmptyLegsController)).toEqual([Role.OWNER]);
  });
});
