import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

const activeOwner = {
  id: 'user-id',
  name: 'Ana Navegante',
  email: 'ana@example.com',
  role: Role.OWNER,
  status: 'ACTIVE',
  owner: { status: 'PENDING' },
};

const activeClient = {
  id: 'client-id',
  name: 'María González',
  email: 'cliente@example.com',
  role: Role.CLIENT,
  status: 'ACTIVE',
  owner: null,
};

function createService() {
  const findUnique = vi.fn();
  const createUser = vi.fn();
  const createBoat = vi.fn();
  const createDocuments = vi.fn();
  const findZones = vi.fn();
  const transaction = {
    user: { create: createUser },
    embarcacion: { create: createBoat },
    ownerDocument: { createMany: createDocuments },
  };
  const prisma = {
    user: { findUnique },
    zona: { findMany: findZones },
    $transaction: vi.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)),
  } as unknown as PrismaService;
  const config = {
    get: vi.fn(() => '1h'),
    getOrThrow: vi.fn(() => 'test-secret-with-more-than-32-characters'),
  } as unknown as ConfigService;
  return {
    service: new AuthService(prisma, config),
    findUnique,
    createUser,
    createBoat,
    createDocuments,
    findZones,
  };
}

describe('AuthService', () => {
  it('inicia sesión con credenciales válidas y emite una sesión', async () => {
    const { service, findUnique } = createService();
    findUnique.mockResolvedValue({
      ...activeOwner,
      passwordHash: await bcrypt.hash('correct-horse-battery', 4),
    } as never);

    const result = await service.login({ email: ' ANA@example.com ', password: 'correct-horse-battery' });

    expect(result.user).toMatchObject({ id: 'user-id', role: Role.OWNER, ownerStatus: 'PENDING' });
    expect(result.token.split('.')).toHaveLength(3);
    expect(result.maxAge).toBe(3600);
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rechaza una contraseña incorrecta sin revelar si existe la cuenta', async () => {
    const { service, findUnique } = createService();
    findUnique.mockResolvedValue({
      ...activeOwner,
      passwordHash: await bcrypt.hash('different-password', 4),
    } as never);

    await expect(service.login({ email: activeOwner.email, password: 'wrong-password' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('registra exclusivamente perfiles OWNER y nunca devuelve el hash', async () => {
    const { service, createUser, createBoat, createDocuments, findZones } = createService();
    const zoneId = '93e8c11a-7ac0-4bdb-97f0-778ff90b1af3';
    createUser.mockResolvedValue({ ...activeOwner, owner: { id: 'owner-id', status: 'PENDING' } });
    createBoat.mockResolvedValue({ id: 'boat-id' });
    findZones.mockResolvedValue([{ id: zoneId }]);
    const file = {
      originalname: 'license.pdf',
      mimetype: 'application/pdf',
      size: 8,
      buffer: Buffer.from('%PDF-1.4'),
    };

    const result = await service.registerOwner({
      name: ' Ana Navegante ',
      email: ' ANA@example.com ',
      password: 'correct-horse-battery',
      phone: '+541112345678',
      boatName: 'Luna',
      matricula: ' ab-123 ',
      capacidad: 8,
      zonaIds: [zoneId],
    }, {
      license: [file],
      insurance: [{ ...file, originalname: 'insurance.pdf' }],
      backgroundCheck: [{ ...file, originalname: 'background.pdf' }],
    });
    const createData = createUser.mock.calls[0][0].data;

    expect(createData).toMatchObject({ email: 'ana@example.com', role: Role.OWNER });
    expect(createData.passwordHash).not.toBe('correct-horse-battery');
    expect(createBoat.mock.calls[0][0].data).toMatchObject({ matricula: 'AB-123', capacidad: 8 });
    expect(createDocuments.mock.calls[0][0].data).toHaveLength(3);
    expect(result).toBeUndefined();
  });

  it('verifica firma y expiración y vuelve a consultar el rol actual del usuario', async () => {
    const { service, findUnique } = createService();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    try {
      findUnique.mockResolvedValue({
        ...activeOwner,
        passwordHash: await bcrypt.hash('unused', 4),
      } as never);
      const session = await service.login({ email: activeOwner.email, password: 'unused' });

      await expect(service.authenticateToken(session.token)).resolves.toMatchObject({ role: Role.OWNER });
      await expect(service.authenticateToken(`${session.token.slice(0, -1)}x`)).resolves.toBeNull();
      vi.advanceTimersByTime(60 * 60 * 1000 + 1000);
      await expect(service.authenticateToken(session.token)).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('rechaza el inicio de sesión de cuentas de cliente', async () => {
    const { service, findUnique } = createService();
    findUnique.mockResolvedValue({
      ...activeClient,
      passwordHash: await bcrypt.hash('correct-horse-battery', 4),
    } as never);

    await expect(
      service.login({ email: activeClient.email, password: 'correct-horse-battery' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('invalida los tokens de cuentas de cliente existentes', async () => {
    const { service, findUnique } = createService();
    findUnique.mockResolvedValue({
      ...activeOwner,
      passwordHash: await bcrypt.hash('correct-horse-battery', 4),
    } as never);
    const session = await service.login({ email: activeOwner.email, password: 'correct-horse-battery' });

    findUnique.mockResolvedValue(activeClient as never);
    await expect(service.authenticateToken(session.token)).resolves.toBeNull();
  });
});
