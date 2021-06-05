import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { InstitutionUserAuthService } from "../services";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtStrategy } from "./jwt.strategy";
import { KeycloakConfig } from "./keycloakConfig";
import { RolesGuard } from "./roles.guard";
import { InstitutionGuard } from "./institution.guard";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      publicKey: KeycloakConfig.PEM_PublicKey,
    }),
  ],
  providers: [
    InstitutionUserAuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: InstitutionGuard,
    },
  ],
})
export class AuthModule {}
