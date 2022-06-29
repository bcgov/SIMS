import { Module } from "@nestjs/common";
import {
  ConfigService,
  DisbursementScheduleService,
  DisbursementReceiptService,
  SshService,
  SequenceControlService,
  StudentRestrictionService,
  RestrictionService,
  ReportService,
} from "../../services";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt-integration.service";
import { DisbursementReceiptProcessingService } from "./disbursement-receipt-processing.service";
import { DisbursementReceiptRequestService } from "./disbursement-receipt-request.service";

@Module({
  providers: [
    SshService,
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptRequestService,
    DisbursementReceiptService,
    DisbursementScheduleService,
    ConfigService,
    SequenceControlService,
    StudentRestrictionService,
    ReportService,
    RestrictionService,
  ],
  exports: [
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptRequestService,
  ],
})
export class DisbursementReceiptIntegrationModule {}
