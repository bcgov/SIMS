import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import {
  InstitutionLocationService,
  InstitutionUserAuthService,
  UserService,
} from "../services";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtStrategy } from "./jwt.strategy";
import { KeycloakConfig } from "./keycloakConfig";
import {
  InstitutionLocationGuard,
  AuthorizedPartiesGuard,
  InstitutionAdminGuard,
  ActiveUserGuard,
  GroupsGuard,
} from "./guards";
import { RolesGuard } from "./guards/roles.guard";

const jwtModule = JwtModule.register({
  publicKey: KeycloakConfig.PEM_PublicKey,
});

@Module({
  imports: [PassportModule, jwtModule],
  providers: [
    UserService,
    InstitutionLocationService,
    InstitutionUserAuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizedPartiesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ActiveUserGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GroupsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: InstitutionAdminGuard,
    },
    {
      provide: APP_GUARD,
      useClass: InstitutionLocationGuard,
    },
  ],
  exports: [jwtModule],
})
export class AuthModule {}
