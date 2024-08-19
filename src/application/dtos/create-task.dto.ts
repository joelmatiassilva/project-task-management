import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsMongoId, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../../domain/entities/task.entity';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateTaskDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TaskStatus, default: TaskStatus.NOT_STARTED })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;


  @ApiProperty()
  @IsMongoId()
  projectId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (Types.ObjectId.isValid(value)) {
      return value;
    }
    return null;
  })
  @ValidateIf((o) => o.assignedTo !== null)
  @IsMongoId()
  assignedTo?: string;
}