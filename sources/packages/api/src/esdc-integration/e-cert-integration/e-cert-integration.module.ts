import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import {
  ConfigService,
  DisbursementScheduleService,
  SequenceControlService,
  SshService,
  StudentRestrictionService,
  DisbursementScheduleErrorsService,
} from "../../services";
import { ECertFileHandler } from "./e-cert-file-handler";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration/e-cert-full-time-integration.service";
import { ECertFullTimeResponseService } from "./e-cert-full-time-integration/e-cert-full-time-response.service";
import { ECertPartTimeIntegrationService } from "./e-cert-part-time-integration/e-cert-part-time-integration.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    ECertFullTimeIntegrationService,
    ECertPartTimeIntegrationService,
    SequenceControlService,
    DisbursementScheduleService,
    StudentRestrictionService,
    ConfigService,
    ECertFullTimeResponseService,
    ECertFileHandler,
    DisbursementScheduleErrorsService,
  ],
  exports: [
    ECertFullTimeIntegrationService,
    ECertPartTimeIntegrationService,
    ECertFullTimeResponseService,
    ECertFileHandler,
  ],
})
export class ECertIntegrationModule {}
