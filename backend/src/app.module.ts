import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './adapters/inbound/http/auth.controller';
import { PropertiesController } from './adapters/inbound/http/properties.controller';
import { PropertyImagesController } from './adapters/inbound/http/properties.controller';
import { UsersController } from './adapters/inbound/http/users.controller';
import {
  ClientsController, CommissionsController, FavoritesController, FollowUpsController,
  InquiriesController, OpportunitiesController, OperationsController, OwnersController,
  PreferencesController, RecommendationsController, ReportsController, VisitsController
} from './adapters/inbound/http/records.controller';
import { PrismaAuthRepository } from './adapters/outbound/persistence/prisma/prisma-auth.repository';
import { PrismaPropertyRepository } from './adapters/outbound/persistence/prisma/prisma-property.repository';
import { PrismaRecommendationRepository } from './adapters/outbound/persistence/prisma/prisma-recommendation.repository';
import { PrismaPriorityRepository } from './adapters/outbound/persistence/prisma/prisma-priority.repository';
import { PrismaRealEstateRepository } from './adapters/outbound/persistence/prisma/prisma-real-estate.repository';
import { PrismaUserAdministrationRepository } from './adapters/outbound/persistence/prisma/prisma-user-administration.repository';
import { PrismaPropertyImageRepository } from './adapters/outbound/persistence/prisma/prisma-property-image.repository';
import { PrismaReportsRepository } from './adapters/outbound/persistence/prisma/prisma-reports.repository';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { ListPropertiesUseCase } from './application/use-cases/list-properties.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { ManageRealEstateUseCases } from './application/use-cases/manage-real-estate.use-case';
import { ManageUsersUseCase } from './application/use-cases/manage-users.use-case';
import { ManagePropertyImagesUseCase } from './application/use-cases/manage-property-images.use-case';
import { GetDetailedReportUseCase } from './application/use-cases/get-detailed-report.use-case';
import { PrioritizeOpportunitiesUseCase } from './application/use-cases/prioritize-opportunities.use-case';
import { RecommendPropertiesUseCase } from './application/use-cases/recommend-properties.use-case';
import { RegisterClientUseCase } from './application/use-cases/register-client.use-case';
import { AUTH_REPOSITORY } from './domain/ports/auth-repository.port';
import { PASSWORD_HASHER } from './domain/ports/password-hasher.port';
import { TOKEN_ISSUER } from './domain/ports/token-issuer.port';
import { PROPERTY_REPOSITORY } from './domain/ports/property-repository.port';
import { PRIORITY_REPOSITORY } from './domain/ports/priority-repository.port';
import { RECOMMENDATION_REPOSITORY } from './domain/ports/recommendation-repository.port';
import { REAL_ESTATE_REPOSITORY } from './domain/ports/real-estate-repository.port';
import { USER_ADMINISTRATION_REPOSITORY } from './domain/ports/user-administration-repository.port';
import { PROPERTY_IMAGE_REPOSITORY } from './domain/ports/property-image-repository.port';
import { REPORTS_REPOSITORY } from './domain/ports/reports-repository.port';
import { validateEnvironment } from './infrastructure/config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RolesGuard } from './infrastructure/security/roles.guard';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtTokenIssuer } from './infrastructure/security/jwt-token-issuer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: Number(config.get<string>('JWT_EXPIRES_IN_SECONDS') ?? 900) }
      })
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule
  ],
  controllers: [
    AuthController, PropertiesController, PropertyImagesController, UsersController, OwnersController, ClientsController,
    PreferencesController, RecommendationsController, FavoritesController,
    InquiriesController, VisitsController, OpportunitiesController,
    FollowUpsController, OperationsController, CommissionsController, ReportsController
  ],
  providers: [
    RegisterClientUseCase,
    LoginUseCase,
    GetCurrentUserUseCase,
    ListPropertiesUseCase,
    ManageRealEstateUseCases,
    ManageUsersUseCase,
    ManagePropertyImagesUseCase,
    GetDetailedReportUseCase,
    RecommendPropertiesUseCase,
    PrioritizeOpportunitiesUseCase,
    { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_ISSUER, useClass: JwtTokenIssuer },
    { provide: PROPERTY_REPOSITORY, useClass: PrismaPropertyRepository },
    { provide: REAL_ESTATE_REPOSITORY, useClass: PrismaRealEstateRepository },
    { provide: USER_ADMINISTRATION_REPOSITORY, useClass: PrismaUserAdministrationRepository },
    { provide: PROPERTY_IMAGE_REPOSITORY, useClass: PrismaPropertyImageRepository },
    { provide: REPORTS_REPOSITORY, useClass: PrismaReportsRepository },
    { provide: RECOMMENDATION_REPOSITORY, useClass: PrismaRecommendationRepository },
    { provide: PRIORITY_REPOSITORY, useClass: PrismaPriorityRepository },
    RolesGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard }
  ]
})
export class AppModule {}
