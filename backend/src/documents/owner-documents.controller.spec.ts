import { ROLES_KEY } from '../auth/roles.decorator.js';
import { Role } from '../generated/prisma/client.js';
import { OwnerDocumentsController } from './owner-documents.controller.js';

describe('OwnerDocumentsController', () => {
	it('restringe el reenvío de documentos al rol OWNER', () => {
		expect(Reflect.getMetadata(ROLES_KEY, OwnerDocumentsController)).toEqual([Role.OWNER]);
	});
});
