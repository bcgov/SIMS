import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import {
  ConfigService,
  DesignationAgreementService,
  FormService,
} from "./services";
import {
  DesignationAgreementAESTController,
  DesignationAgreementServiceController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [DesignationAgreementAESTController],
  providers: [
    FormService,
    ConfigService,
    DesignationAgreementService,
    DesignationAgreementServiceController,
  ],
})
export class AppAESTModule {}
