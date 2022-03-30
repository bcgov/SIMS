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
import { ECertIntegrationService } from "./e-cert-integration.service";
import { ECertRequestService } from "./e-cert-request.service";
import { ECertResponseService } from "./e-cert-response.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    ECertIntegrationService,
    ECertRequestService,
    SequenceControlService,
    DisbursementScheduleService,
    StudentRestrictionService,
    ConfigService,
    ECertResponseService,
    DisbursementScheduleErrorsService,
  ],
  exports: [ECertIntegrationService, ECertRequestService, ECertResponseService],
})
export class ECertIntegrationModule {}
