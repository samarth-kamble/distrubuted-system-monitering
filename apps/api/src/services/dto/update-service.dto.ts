import {
  IsString,
  IsOptional,
  IsUrl,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { HttpMethod } from '@prisma/client';

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUrl({}, { message: 'targetUrl must be a valid URL address' })
  @IsOptional()
  targetUrl?: string;

  @IsEnum(HttpMethod)
  @IsOptional()
  method?: HttpMethod;

  @IsInt()
  @Min(10)
  @Max(86400)
  @IsOptional()
  intervalSeconds?: number;

  @IsInt()
  @Min(500)
  @Max(30000)
  @IsOptional()
  timeoutMs?: number;

  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  retryCount?: number;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  failureThreshold?: number;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  recoveryThreshold?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
