import { Module, OnModuleInit } from "@nestjs/common";
import { collectDefaultMetrics, register } from "prom-client";
import { DEFAULT_METRICS_APP_LABEL } from "./controllers/metrics/metrics.models";
import { DatabaseModule } from "@sims/sims-db";
import {
  AssessmentController,
  ApplicationController,
  ProgramInfoRequestController,
  SupportingUserController,
  CRAIntegrationController,
  DisbursementController,
  HealthController,
  MetricsController,
} from "./controllers";
import {
  StudentAssessmentService,
  ApplicationService,
  ApplicationExceptionService,
  SupportingUserService,
  CRAIncomeVerificationService,
  MSFAANumberService,
  DisbursementScheduleService,
  ApplicationExceptionSearchService,
  ApplicationExceptionHashService,
  ProgramInfoRequestService,
} from "./services";
import { ZeebeHealthIndicator, ZeebeTransportStrategy } from "./zeebe";
import {
  DisbursementScheduleSharedService,
  SequenceControlService,
  WorkflowClientService,
  ZeebeModule,
  DisbursementOverawardService,
  NotificationsModule,
  NoteSharedService,
  MSFAANumberSharedService,
  ConfirmationOfEnrollmentService,
  GlobalHttpModule,
  AssessmentSequentialProcessingService,
  StudentLoanBalanceSharedService,
  SFASPartTimeApplicationsService,
  SFASApplicationService,
  RestrictionSharedService,
} from "@sims/services";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";
import { SystemUserModule } from "@sims/services/system-users";
import { TerminusModule } from "@nestjs/terminus";

@Module({
  imports: [
    GlobalHttpModule,
    DatabaseModule,
    ConfigModule,
    LoggerModule,
    ZeebeModule.forRoot(),
    SystemUserModule,
    NotificationsModule,
    TerminusModule,
  ],
  controllers: [
    AssessmentController,
    ApplicationController,
    ProgramInfoRequestController,
    SupportingUserController,
    CRAIntegrationController,
    DisbursementController,
    HealthController,
    MetricsController,
  ],
  providers: [
    ZeebeTransportStrategy,
    WorkflowClientService,
    StudentAssessmentService,
    ApplicationService,
    ApplicationExceptionService,
    ApplicationExceptionSearchService,
    ApplicationExceptionHashService,
    SupportingUserService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    CRAIncomeVerificationService,
    DisbursementScheduleSharedService,
    DisbursementScheduleService,
    SequenceControlService,
    MSFAANumberService,
    MSFAANumberSharedService,
    DisbursementOverawardService,
    NoteSharedService,
    RestrictionSharedService,
    ConfirmationOfEnrollmentService,
    ZeebeHealthIndicator,
    AssessmentSequentialProcessingService,
    StudentLoanBalanceSharedService,
    ProgramInfoRequestService,
  ],
})
export class WorkersModule implements OnModuleInit {
  /**
   * Initializes Prometheus default metrics collection for the workers application.
   */
  onModuleInit(): void {
    register.setDefaultLabels({ app: DEFAULT_METRICS_APP_LABEL });
    collectDefaultMetrics({ labels: { app: DEFAULT_METRICS_APP_LABEL } });
  }
}
