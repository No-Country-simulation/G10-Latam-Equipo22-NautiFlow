import { IsIn } from 'class-validator';

export class UpdateTripStatusDto {
	@IsIn(['PENDING', 'ASSIGNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
	status: 'PENDING' | 'ASSIGNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}