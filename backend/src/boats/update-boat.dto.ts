import { PartialType } from '@nestjs/swagger';
import { CreateBoatDto } from './create-boat.dto.js';

export class UpdateBoatDto extends PartialType(CreateBoatDto) {}
