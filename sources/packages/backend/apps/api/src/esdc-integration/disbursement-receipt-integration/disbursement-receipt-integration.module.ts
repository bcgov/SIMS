import { Module } from "@nestjs/common";
import {
  DisbursementScheduleService,
  DisbursementReceiptService,
  SshService,
  StudentRestrictionService,
  RestrictionService,
  ReportService,
  StudentService,
  SFASIndividualService,
} from "../../services";
import { SequenceControlService } from "@sims/services";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt-integration.service";
import { DisbursementReceiptProcessingService } from "./disbursement-receipt-processing.service";
import { DisbursementReceiptRequestService } from "./disbursement-receipt-request.service";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";
import { NotificationsModule } from "@sims/services/notifications";

@Module({
  imports: [LoggerModule, ConfigModule, NotificationsModule],
  providers: [
    SshService,
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptRequestService,
    DisbursementReceiptService,
    DisbursementScheduleService,
    SequenceControlService,
    StudentRestrictionService,
    ReportService,
    RestrictionService,
    StudentService,
    SFASIndividualService,
  ],
  exports: [
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptRequestService,
  ],
})
export class DisbursementReceiptIntegrationModule {}
