import { Injectable } from '@nestjs/common';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { DocumentType, Role } from '../generated/prisma/client.js';
import type { RegisterOwnerDto } from './register-owner.dto.js';
import type { OwnerRegistrationFiles, UploadedDocumentFile } from '../documents/file.types.js';
import { safeFilename, validateUploadedFile } from '../documents/file-validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './login.dto.js';
import type { AuthenticatedUser } from './types.js';

const userSelection = {
	id: true,
	name: true,
	email: true,
	role: true,
	status: true,
	owner: { select: { status: true } },
} as const;

type SessionResult = {
	user: AuthenticatedUser;
	token: string;
	maxAge: number;
};

type TokenPayload = {
	sub: string;
	iat: number;
	exp: number;
};

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly config: ConfigService,
	) {}

	async registerOwner(dto: RegisterOwnerDto, files: OwnerRegistrationFiles): Promise<void> {
		const requiredFiles: Array<[keyof OwnerRegistrationFiles, DocumentType]> = [
			['license', DocumentType.LICENSE],
			['insurance', DocumentType.INSURANCE],
			['backgroundCheck', DocumentType.BACKGROUND_CHECK],
		];
		const uploads: Array<{ type: DocumentType; file: UploadedDocumentFile }> = [];

		for (const [field, type] of requiredFiles) {
			const file = files[field]?.[0];
			if (!file) throw new BadRequestException(`Falta el documento requerido: ${field}.`);
			validateUploadedFile(file);
			uploads.push({ type, file });
		}

		for (const file of files.photos ?? []) {
			validateUploadedFile(file, false);
			uploads.push({ type: DocumentType.PHOTO, file });
		}

		const zoneIds = [...new Set(dto.zonaIds)];
		const zones = await this.prisma.zona.findMany({
			where: { id: { in: zoneIds }, activa: true },
			select: { id: true },
		});
		if (zones.length !== zoneIds.length) {
			throw new BadRequestException('Una o más zonas no existen o no están disponibles.');
		}

		try {
			await this.prisma.$transaction(async (transaction) => {
				const createdUser = await transaction.user.create({
					data: {
						name: dto.name.trim(),
						email: dto.email.trim().toLowerCase(),
						passwordHash: await bcrypt.hash(dto.password, 12),
						role: Role.OWNER,
						owner: { create: { phone: dto.phone.trim(), whatsappPhone: dto.whatsappPhone?.trim() } },
					},
					select: {
						...userSelection,
						owner: { select: { id: true, status: true } },
					},
				});

				const boat = await transaction.embarcacion.create({
					data: {
						propietarioId: createdUser.owner!.id,
						nombre: dto.boatName.trim(),
						matricula: dto.matricula.trim().toUpperCase(),
						capacidad: dto.capacidad,
						descripcion: dto.descripcion?.trim(),
						zonas: {
							create: zoneIds.map((zonaId) => ({ zona: { connect: { id: zonaId } } })),
						},
					},
				});

				await transaction.ownerDocument.createMany({
					data: uploads.map(({ type, file }) => ({
						ownerId: createdUser.owner!.id,
						boatId: boat.id,
						type,
						filename: safeFilename(file.originalname),
						mimeType: file.mimetype,
						size: file.size,
						content: new Uint8Array(file.buffer),
					})),
				});

				return createdUser;
			});

		} catch (error) {
			if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
				return;
			}
			throw error;
		}
	}

	async login(dto: LoginDto): Promise<SessionResult> {
		const user = await this.prisma.user.findUnique({
			where: { email: dto.email.trim().toLowerCase() },
			select: { ...userSelection, passwordHash: true },
		});

		if (
			!user ||
			user.status !== 'ACTIVE' ||
			!(await bcrypt.compare(dto.password, user.passwordHash)) ||
			!this.isAllowedRole(user.role)
		) {
			throw new UnauthorizedException('Correo o contraseña incorrectos.');
		}

		return this.createSession(this.toAuthenticatedUser(user));
	}

	async authenticateToken(token: string): Promise<AuthenticatedUser | null> {
		const payload = this.verifyToken(token);
		if (!payload) return null;

		const user = await this.prisma.user.findUnique({
			where: { id: payload.sub },
			select: userSelection,
		});

		if (!user || user.status !== 'ACTIVE' || !this.isAllowedRole(user.role)) return null;
		return this.toAuthenticatedUser(user);
	}

	private isAllowedRole(role: Role): boolean {
		return role === Role.ADMIN || role === Role.OWNER;
	}

	private createSession(user: AuthenticatedUser): SessionResult {
		const maxAge = this.getTokenMaxAge();
		const now = Math.floor(Date.now() / 1000);
		const header = this.encode({ alg: 'HS256', typ: 'JWT' });
		const payload = this.encode({ sub: user.id, iat: now, exp: now + maxAge });
		const input = `${header}.${payload}`;
		const signature = createHmac('sha256', this.jwtSecret()).update(input).digest('base64url');

		return { user, token: `${input}.${signature}`, maxAge };
	}

	private verifyToken(token: string): TokenPayload | null {
		try {
			const [headerPart, payloadPart, signature] = token.split('.');
			if (!headerPart || !payloadPart || !signature) return null;

			const input = `${headerPart}.${payloadPart}`;
			const expected = createHmac('sha256', this.jwtSecret()).update(input).digest();
			const actual = Buffer.from(signature, 'base64url');
			if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

			const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8')) as {
				alg?: string;
			};
			const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as Partial<TokenPayload>;
			if (
				header.alg !== 'HS256' ||
				typeof payload.sub !== 'string' ||
				typeof payload.exp !== 'number' ||
				payload.exp <= Math.floor(Date.now() / 1000)
			) {
				return null;
			}

			return payload as TokenPayload;
		} catch {
			return null;
		}
	}

	private toAuthenticatedUser(user: {
		id: string;
		name: string;
		email: string;
		role: Role;
		owner: { status: string } | null;
	}): AuthenticatedUser {
		return {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			ownerStatus: user.owner?.status ?? null,
		};
	}

	private getTokenMaxAge(): number {
		const duration = this.config.get<string>('JWT_EXPIRES_IN') ?? '1d';
		const match = /^(\d+)([smhd])$/.exec(duration);
		if (!match) throw new Error('JWT_EXPIRES_IN debe usar segundos, minutos, horas o días.');

		const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as 's' | 'm' | 'h' | 'd'];
		return Number(match[1]) * multiplier;
	}

	private jwtSecret(): string {
		return this.config.getOrThrow<string>('JWT_SECRET');
	}

	private encode(value: object): string {
		return Buffer.from(JSON.stringify(value)).toString('base64url');
	}
}
