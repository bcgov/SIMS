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
  GCNotifyActionsService,
  GCNotifyService,
  NotificationService,
  NotificationMessageService,
} from "../../services";
import { SequenceControlService } from "@sims/services";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt-integration.service";
import { DisbursementReceiptProcessingService } from "./disbursement-receipt-processing.service";
import { DisbursementReceiptRequestService } from "./disbursement-receipt-request.service";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";

@Module({
  imports: [LoggerModule, ConfigModule],
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
    GCNotifyService,
    GCNotifyActionsService,
    NotificationService,
    NotificationMessageService,
  ],
  exports: [
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptRequestService,
  ],
})
export class DisbursementReceiptIntegrationModule {}
