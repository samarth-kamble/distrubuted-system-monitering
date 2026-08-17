import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { HttpMethod } from '@prisma/client';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'targetUrl must be a valid HTTP or HTTPS URL address' },
  )
  targetUrl: string;

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
}
