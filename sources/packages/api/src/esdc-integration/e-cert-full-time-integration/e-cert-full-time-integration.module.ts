import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import {
  ConfigService,
  DisbursementScheduleService,
  SequenceControlService,
  SshService,
  StudentRestrictionService,
} from "../../services";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration.service";
import { ECertFullTimeRequestService } from "./e-cert-full-time-request.service";

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
  ],
  exports: [ECertFullTimeIntegrationService, ECertFullTimeRequestService],
})
export class ECertFullTimeIntegrationModule {}
