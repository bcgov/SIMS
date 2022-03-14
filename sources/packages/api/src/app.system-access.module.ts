import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import {
  ConfigService,
  DesignationAgreementService,
  FormService,
} from "./services";
import {
  DesignationAgreementInstitutionsController,
  DesignationAgreementControllerService,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [DesignationAgreementInstitutionsController],
  providers: [
    FormService,
    ConfigService,
    DesignationAgreementService,
    DesignationAgreementControllerService,
  ],
})
export class AppSystemAccessModule {}
