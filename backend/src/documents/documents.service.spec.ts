import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DocumentStatus, DocumentType, OwnerStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocumentsService } from './documents.service.js';

const ownerBase = {
	id: 'owner-id',
	status: OwnerStatus.PENDING,
	embarcaciones: [{ id: 'boat-id' }],
};

function pdfFile(originalname = 'licencia.pdf') {
	const buffer = Buffer.from('%PDF-1.7 contenido de prueba');
	return { originalname, mimetype: 'application/pdf', size: buffer.length, buffer };
}

function pngFile(originalname = 'foto.png') {
	const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
	return { originalname, mimetype: 'image/png', size: buffer.length, buffer };
}

function createService(owner: typeof ownerBase | null = ownerBase) {
	const prisma = {
		owner: {
			findUnique: vi.fn().mockResolvedValue(owner),
			update: vi.fn().mockResolvedValue({}),
			findUniqueOrThrow: vi.fn(),
		},
		embarcacion: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
		ownerDocument: {
			findFirst: vi.fn().mockResolvedValue(null),
			update: vi.fn().mockResolvedValue({}),
			create: vi.fn().mockResolvedValue({}),
			createMany: vi.fn().mockResolvedValue({ count: 1 }),
			deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
			findMany: vi.fn().mockResolvedValue([]),
		},
		$transaction: vi.fn(),
	};
	prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) =>
		callback(prisma),
	);
	return { service: new DocumentsService(prisma as unknown as PrismaService), prisma };
}

describe('DocumentsService - reenvío de documentos', () => {
	it('reemplaza el documento existente y lo deja pendiente de revisión', async () => {
		const { service, prisma } = createService();
		prisma.ownerDocument.findFirst.mockResolvedValue({ id: 'doc-id' });

		const file = pdfFile();
		await service.uploadOwnDocuments('user-id', { license: [file] });

		expect(prisma.ownerDocument.update).toHaveBeenCalledWith({
			where: { id: 'doc-id' },
			data: expect.objectContaining({
				filename: 'licencia.pdf',
				mimeType: 'application/pdf',
				size: file.size,
				status: DocumentStatus.PENDING,
				reviewNote: null,
				reviewedAt: null,
				reviewedById: null,
			}),
		});
		expect(prisma.ownerDocument.create).not.toHaveBeenCalled();
		expect(prisma.owner.update).not.toHaveBeenCalled();
	});

	it('crea el documento si el propietario todavía no lo tenía', async () => {
		const { service, prisma } = createService();

		await service.uploadOwnDocuments('user-id', { backgroundCheck: [pdfFile('antecedentes.pdf')] });

		expect(prisma.ownerDocument.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				ownerId: 'owner-id',
				boatId: 'boat-id',
				type: DocumentType.BACKGROUND_CHECK,
				status: DocumentStatus.PENDING,
			}),
		});
	});

	it('rechaza la carga sin archivos', async () => {
		const { service, prisma } = createService();

		await expect(service.uploadOwnDocuments('user-id', {})).rejects.toBeInstanceOf(
			BadRequestException,
		);
		expect(prisma.$transaction).not.toHaveBeenCalled();
	});

	it('no permite cambiar documentos de una solicitud aprobada', async () => {
		const { service } = createService({ ...ownerBase, status: OwnerStatus.APPROVED });

		await expect(
			service.uploadOwnDocuments('user-id', { license: [pdfFile()] }),
		).rejects.toBeInstanceOf(ConflictException);
	});

	it('lanza 404 si el usuario no tiene ficha de propietario', async () => {
		const { service } = createService(null);

		await expect(
			service.uploadOwnDocuments('user-id', { license: [pdfFile()] }),
		).rejects.toBeInstanceOf(NotFoundException);
	});

	it('reabre la solicitud rechazada y devuelve las lanchas a pendiente', async () => {
		const { service, prisma } = createService({ ...ownerBase, status: OwnerStatus.REJECTED });

		const result = await service.uploadOwnDocuments('user-id', { insurance: [pdfFile('seguro.pdf')] });

		expect(result.ownerStatus).toBe(OwnerStatus.PENDING);
		expect(prisma.owner.update).toHaveBeenCalledWith({
			where: { id: 'owner-id' },
			data: {
				status: OwnerStatus.PENDING,
				reviewNote: null,
				reviewedAt: null,
				reviewedById: null,
			},
		});
		expect(prisma.embarcacion.updateMany).toHaveBeenCalledWith({
			where: { propietarioId: 'owner-id', estado: 'RECHAZADA' },
			data: { estado: 'PENDIENTE' },
		});
	});

	it('reemplaza el conjunto de fotos de la embarcación', async () => {
		const { service, prisma } = createService();

		await service.uploadOwnDocuments('user-id', { photos: [pngFile('a.png'), pngFile('b.png')] });

		expect(prisma.ownerDocument.deleteMany).toHaveBeenCalledWith({
			where: { ownerId: 'owner-id', type: DocumentType.PHOTO },
		});
		const createMany = prisma.ownerDocument.createMany.mock.calls[0][0];
		expect(createMany.data).toHaveLength(2);
		expect(createMany.data[0]).toEqual(
			expect.objectContaining({ type: DocumentType.PHOTO, boatId: 'boat-id' }),
		);
	});
});
