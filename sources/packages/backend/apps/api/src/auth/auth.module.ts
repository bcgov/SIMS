import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import {
  InstitutionLocationService,
  InstitutionUserAuthService,
  StudentRestrictionService,
  KeycloakService,
  TokensService,
  UserService,
  StudentService,
  SINValidationService,
  DesignationAgreementLocationService,
  RestrictionService,
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
} from "./guards";
import { RolesGuard } from "./guards/roles.guard";
import { ConfigModule } from "@sims/utilities/config";
import { IntegrationStudentRestrictionService } from "@sims/integrations/services";
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
    StudentRestrictionService,
    TokensService,
    KeycloakService,
    JwtStrategy,
    StudentService,
    SFASIndividualService,
    SINValidationService,
    RestrictionService,
    DesignationAgreementLocationService,
    IntegrationStudentRestrictionService,
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
  ],
  exports: [jwtModule, TokensService, KeycloakService],
})
export class AuthModule {}
