import { IsUUID } from 'class-validator';

export class AssignBoatDto {
	@IsUUID('4')
	boatId: string;
}