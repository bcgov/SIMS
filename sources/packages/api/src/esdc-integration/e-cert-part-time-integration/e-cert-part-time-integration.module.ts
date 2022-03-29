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
import { ECertPartTimeIntegrationService } from "./e-cert-part-time-integration.service";
import { ECertPartTimeRequestService } from "./e-cert-part-time-request.service";
@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    ECertPartTimeIntegrationService,
    ECertPartTimeRequestService,
    SequenceControlService,
    DisbursementScheduleService,
    StudentRestrictionService,
    ConfigService,
    DisbursementScheduleErrorsService,
  ],
  exports: [ECertPartTimeIntegrationService, ECertPartTimeRequestService],
})
export class ECertPartTimeIntegrationModule {}
