import { plainToInstance } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  JWT_EXPIRES_IN_SECONDS = 900;

  @IsInt()
  @Min(1)
  PORT = 3001;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const parsed = plainToInstance(EnvironmentVariables, {
    ...config,
    PORT: Number(config.PORT ?? 3001),
    JWT_EXPIRES_IN_SECONDS: Number(config.JWT_EXPIRES_IN_SECONDS ?? 900)
  });
  const errors = validateSync(parsed, { skipMissingProperties: false });
  if (errors.length) {
    throw new Error(`Invalid environment configuration: ${errors.map((error) => error.property).join(', ')}`);
  }
  if (String(config.JWT_SECRET).length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }
  return parsed;
}
