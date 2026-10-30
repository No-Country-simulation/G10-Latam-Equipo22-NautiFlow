import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	Res,
	UploadedFiles,
	UseInterceptors,
	UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { RateLimitGuard } from '../common/guards/rate-limit.guard.js';
import type { OwnerRegistrationFiles } from '../documents/file.types.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { LoginDto } from './login.dto.js';
import { RegisterOwnerDto } from './register-owner.dto.js';
import type { AuthenticatedRequest } from './types.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post(['register/lanchero', 'register'])
	@HttpCode(HttpStatus.ACCEPTED)
	@UseGuards(RateLimitGuard)
	@UseInterceptors(
		FileFieldsInterceptor(
			[
				{ name: 'license', maxCount: 1 },
				{ name: 'insurance', maxCount: 1 },
				{ name: 'backgroundCheck', maxCount: 1 },
				{ name: 'photos', maxCount: 5 },
			],
			{ limits: { fileSize: 5 * 1024 * 1024, files: 8, fields: 20 } },
		),
	)
	async registerOwner(
		@Body() dto: RegisterOwnerDto,
		@UploadedFiles() files: OwnerRegistrationFiles,
		@Res({ passthrough: true }) response: Response,
	) {
		await this.authService.registerOwner(dto, files ?? {});
		response.setHeader('Cache-Control', 'no-store');
		return { message: 'Solicitud recibida. Si los datos permiten procesarla, quedará pendiente de revisión.' };
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@UseGuards(RateLimitGuard)
	async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
		const session = await this.authService.login(dto);
		this.setSessionCookie(response, session.token, session.maxAge);
		return { user: session.user };
	}

	@Post('logout')
	@HttpCode(HttpStatus.NO_CONTENT)
	logout(@Res({ passthrough: true }) response: Response) {
		this.setSessionCookie(response, '', 0);
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	me(@Req() request: AuthenticatedRequest) {
		return { user: request.user };
	}

	private setSessionCookie(response: Response, token: string, maxAge: number) {
		const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
		response.setHeader('Cache-Control', 'no-store');
		response.setHeader(
			'Set-Cookie',
			`nautiflow_session=${token}; HttpOnly; SameSite=Lax; Path=/api/v1; Max-Age=${maxAge}${secure}`,
		);
	}
}
