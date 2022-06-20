import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { DisbursementReceiptIntegrationModule } from "./esdc-integration/disbursement-receipt-integration/disbursement-receipt-integration.module";
import {
  ApplicationExceptionService,
  ConfigService,
  DisbursementScheduleService,
  EducationProgramOfferingService,
  SequenceControlService,
  StudentAssessmentService,
  StudentRestrictionService,
  WorkflowActionsService,
  WorkflowService,
  RestrictionService,
} from "./services";
import {
  ApplicationExceptionSystemAccessController,
  AssessmentControllerService,
  AssessmentSystemAccessController,
  DisbursementReceiptSystemAccessController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    AuthModule,
    DisbursementReceiptIntegrationModule,
  ],
  controllers: [
    AssessmentSystemAccessController,
    ApplicationExceptionSystemAccessController,
    DisbursementReceiptSystemAccessController,
  ],
  providers: [
    ConfigService,
    WorkflowActionsService,
    WorkflowService,
    StudentAssessmentService,
    EducationProgramOfferingService,
    DisbursementScheduleService,
    SequenceControlService,
    StudentRestrictionService,
    AssessmentControllerService,
    RestrictionService,
    ApplicationExceptionService,
  ],
})
export class AppSystemAccessModule {}
