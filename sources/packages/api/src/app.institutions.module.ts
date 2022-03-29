import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import {
  ConfigService,
  DesignationAgreementService,
  FormService,
  InstitutionService,
  BCeIDService,
  UserService,
  InstitutionLocationService,
  DesignationAgreementLocationService,
} from "./services";
import {
  DesignationAgreementInstitutionsController,
  DesignationAgreementControllerService,
  InstitutionInstitutionsController,
  InstitutionControllerService,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [
    DesignationAgreementInstitutionsController,
    InstitutionInstitutionsController,
  ],
  providers: [
    FormService,
    ConfigService,
    DesignationAgreementService,
    DesignationAgreementControllerService,
    InstitutionService,
    BCeIDService,
    UserService,
    InstitutionLocationService,
    InstitutionControllerService,
    DesignationAgreementLocationService,
  ],
})
export class AppInstitutionsModule {}
