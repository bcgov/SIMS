import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import {
  InstitutionLocationService,
  InstitutionUserAuthService,
  UserService,
  StudentService,
  SINValidationService,
  DesignationAgreementLocationService,
  InstitutionService,
  BCeIDService,
} from "../services";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtStrategy } from "./jwt.strategy";
import {
  InstitutionLocationGuard,
  AuthorizedPartiesGuard,
  InstitutionAdminGuard,
  ActiveUserGuard,
  GroupsGuard,
  SINValidationGuard,
  RequiresStudentAccountGuard,
  InstitutionBCPublicGuard,
  InstitutionStudentDataAccessGuard,
  RequiresUserAccountGuard,
} from "./guards";
import { RolesGuard } from "./guards/roles.guard";
import { ConfigModule } from "@sims/utilities/config";
import { SFASIndividualService } from "@sims/services/sfas";
import {
  DisbursementOverawardService,
  NoteSharedService,
} from "@sims/services";
import { KeycloakService } from "@sims/auth/services";
import { KeycloakConfig } from "@sims/auth/config";

const jwtModule = JwtModule.register({
  publicKey: KeycloakConfig.PEM_PublicKey,
});

@Module({
  imports: [ConfigModule, PassportModule, jwtModule],
  providers: [
    UserService,
    InstitutionLocationService,
    InstitutionUserAuthService,
    KeycloakService,
    JwtStrategy,
    StudentService,
    SFASIndividualService,
    SINValidationService,
    DesignationAgreementLocationService,
    DisbursementOverawardService,
    NoteSharedService,
    InstitutionService,
    BCeIDService,
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
      useClass: InstitutionBCPublicGuard,
    },
    {
      provide: APP_GUARD,
      useClass: InstitutionStudentDataAccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RequiresUserAccountGuard,
    },
  ],
  exports: [jwtModule, KeycloakService],
})
export class AuthModule {}
