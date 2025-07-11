import { IsArray, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStatus } from '../entities/application.entity';

export class BulkUpdateItem {
  @ApiProperty({ description: 'Application ID' })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'New status for the application',
    enum: ApplicationStatus,
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}

export class BulkUpdateApplicationDto {
  @ApiProperty({
    description: 'Array of applications to update',
    type: [BulkUpdateItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateItem)
  updates: BulkUpdateItem[];
}
