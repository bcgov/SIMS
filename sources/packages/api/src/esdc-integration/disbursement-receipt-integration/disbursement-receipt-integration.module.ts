import { Module } from "@nestjs/common";
import {
  ConfigService,
  DisbursementScheduleService,
  DisbursementReceiptService,
  SshService,
  SequenceControlService,
  StudentRestrictionService,
  RestrictionService,
} from "../../services";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt-integration.service";
import { DisbursementReceiptProcessingService } from "./disbursement-receipt-processing.service";

@Module({
  providers: [
    SshService,
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptService,
    DisbursementScheduleService,
    ConfigService,
    SequenceControlService,
    StudentRestrictionService,
    RestrictionService,
  ],
  exports: [
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
  ],
})
export class DisbursementReceiptIntegrationModule {}
