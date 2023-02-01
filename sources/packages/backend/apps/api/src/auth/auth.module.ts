import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import {
  InstitutionLocationService,
  InstitutionUserAuthService,
  KeycloakService,
  TokensService,
  UserService,
  StudentService,
  SINValidationService,
  DesignationAgreementLocationService,
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
  SINValidationGuard,
  RequiresStudentAccountGuard,
  PayloadMaxSizeGuard,
} from "./guards";
import { RolesGuard } from "./guards/roles.guard";
import { ConfigModule } from "@sims/utilities/config";
import { SFASIndividualService } from "@sims/services/sfas";

const jwtModule = JwtModule.register({
  publicKey: KeycloakConfig.PEM_PublicKey,
});

@Module({
  imports: [ConfigModule, PassportModule, jwtModule],
  providers: [
    UserService,
    InstitutionLocationService,
    InstitutionUserAuthService,
    TokensService,
    KeycloakService,
    JwtStrategy,
    StudentService,
    SFASIndividualService,
    SINValidationService,
    DesignationAgreementLocationService,
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
    {
      provide: APP_GUARD,
      useClass: RequiresStudentAccountGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SINValidationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PayloadMaxSizeGuard,
    },
  ],
  exports: [jwtModule, TokensService, KeycloakService],
})
export class AuthModule {}
