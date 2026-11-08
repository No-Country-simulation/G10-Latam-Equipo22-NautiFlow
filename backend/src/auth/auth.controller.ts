import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Patch,
	Post,
	Req,
	Res,
	UploadedFiles,
	UseInterceptors,
	UseGuards,
} from '@nestjs/common';
import {
	ApiAcceptedResponse,
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiConsumes,
	ApiNoContentResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiTooManyRequestsResponse,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { RateLimitGuard } from '../common/guards/rate-limit.guard.js';
import type { OwnerRegistrationFiles } from '../documents/file.types.js';
import { AuthService } from './auth.service.js';
import {
	LoginResponseDto,
	MeResponseDto,
	MessageResponseDto,
} from './auth.responses.js';
import { ChangePasswordDto } from './change-password.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { LoginDto } from './login.dto.js';
import { RegisterOwnerDto } from './register-owner.dto.js';
import type { AuthenticatedRequest } from './types.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(@Inject(AuthService) private readonly authService: AuthService) {}

	@Post(['register/lanchero', 'register'])
	@HttpCode(HttpStatus.ACCEPTED)
	@UseGuards(RateLimitGuard)
	@ApiConsumes('multipart/form-data')
	@ApiOperation({ summary: 'Registro de lanchero con documentación en archivos' })
	@ApiAcceptedResponse({
		type: MessageResponseDto,
		description: 'La solicitud queda PENDIENTE hasta la revisión de documentación.',
	})
	@ApiBadRequestResponse({ description: 'Datos o archivos inválidos.' })
	@ApiTooManyRequestsResponse({ description: 'Demasiados intentos desde este origen.' })
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
	@ApiOperation({ summary: 'Inicia sesión y devuelve el usuario en una cookie HttpOnly' })
	@ApiOkResponse({ type: LoginResponseDto })
	@ApiUnauthorizedResponse({ description: 'Credenciales inválidas o usuario inactivo.' })
	@ApiTooManyRequestsResponse({ description: 'Demasiados intentos desde este origen.' })
	async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
		const session = await this.authService.login(dto);
		this.setSessionCookie(response, session.token, session.maxAge);
		return { user: session.user };
	}

	@Post('logout')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Cierra la sesión limpiando la cookie' })
	@ApiNoContentResponse()
	logout(@Res({ passthrough: true }) response: Response) {
		this.setSessionCookie(response, '', 0);
	}

	@Get('me')
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Devuelve el usuario de la sesión actual' })
	@ApiOkResponse({ type: MeResponseDto })
	@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
	me(@Req() request: AuthenticatedRequest) {
		return { user: request.user };
	}

	@Patch('me/password')
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard, RateLimitGuard)
	@ApiOperation({ summary: 'Cambia la contraseña del usuario autenticado' })
	@ApiOkResponse({ type: MessageResponseDto })
	@ApiBadRequestResponse({ description: 'Contraseña actual incorrecta o nueva fuera de requisitos.' })
	@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida.' })
	async changePassword(@Req() request: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
		await this.authService.changePassword(request.user!.id, dto);
		return { message: 'Contraseña actualizada.' };
	}

	private setSessionCookie(response: Response, token: string, maxAge: number) {
		const isProd = process.env.NODE_ENV === 'production';
		const sameSite = isProd ? 'SameSite=None' : 'SameSite=Lax';
		const secure = isProd ? '; Secure' : '';
		response.setHeader('Cache-Control', 'no-store');
		response.setHeader(
			'Set-Cookie',
			`nautiflow_session=${token}; HttpOnly; ${sameSite}; Path=/api/v1; Max-Age=${maxAge}${secure}`,
		);
	}
}
