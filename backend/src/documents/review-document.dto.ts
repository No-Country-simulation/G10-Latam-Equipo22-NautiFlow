import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class ReviewDocumentDto {
	@IsIn(['APPROVED', 'REJECTED'])
	decision: 'APPROVED' | 'REJECTED';

	@IsString()
	@MinLength(3)
	@MaxLength(1000)
	note: string;
}