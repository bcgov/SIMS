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
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration.service";
import { ECertFullTimeRequestService } from "./e-cert-full-time-request.service";
import { ECertFullTimeResponseService } from "./e-cert-full-time-response.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    ECertFullTimeIntegrationService,
    ECertFullTimeRequestService,
    SequenceControlService,
    DisbursementScheduleService,
    StudentRestrictionService,
    ConfigService,
    ECertFullTimeResponseService,
    DisbursementScheduleErrorsService,
  ],
  exports: [
    ECertFullTimeIntegrationService,
    ECertFullTimeRequestService,
    ECertFullTimeResponseService,
  ],
})
export class ECertFullTimeIntegrationModule {}
