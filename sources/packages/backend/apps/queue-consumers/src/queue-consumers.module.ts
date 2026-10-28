import { Module, OnApplicationBootstrap } from "@nestjs/common";
import {
  QueueModule,
  QueueModuleLegacy,
  QueueService,
} from "@sims/services/queue";
import {
  StartApplicationAssessmentProcessor,
  CancelApplicationAssessmentProcessor,
  ProcessNotificationScheduler,
  IER12IntegrationScheduler,
  CRAResponseIntegrationScheduler,
  CRAProcessIntegrationScheduler,
  SINValidationProcessIntegrationScheduler,
  SINValidationResponseIntegrationScheduler,
  StudentLoanBalancesPartTimeIntegrationScheduler,
  FullTimeMSFAAProcessIntegrationScheduler,
  PartTimeMSFAAProcessIntegrationScheduler,
  PartTimeECertProcessIntegrationScheduler,
  FullTimeECertProcessIntegrationScheduler,
  FullTimeECertFeedbackIntegrationScheduler,
  PartTimeECertFeedbackIntegrationScheduler,
  DisbursementReceiptsFileIntegrationScheduler,
  FederalRestrictionsIntegrationScheduler,
  FullTimeMSFAAProcessResponseIntegrationScheduler,
  PartTimeMSFAAProcessResponseIntegrationScheduler,
  SFASIntegrationScheduler,
  ProcessArchiveApplicationsScheduler,
  ECEProcessIntegrationScheduler,
  ECEResponseIntegrationScheduler,
  AssessmentWorkflowEnqueuerScheduler,
  WorkflowQueueRetryScheduler,
  CASSupplierIntegrationScheduler,
  ApplicationChangesReportIntegrationScheduler,
  StudentApplicationNotificationsScheduler,
  SIMSToSFASIntegrationScheduler,
  CASInvoicesBatchesCreationScheduler,
  CASSendInvoicesScheduler,
  ECertCancellationResponseIntegrationScheduler,
  T4AUploadEnqueuerScheduler,
  T4AUploadProcessor,
  ReturnedLoansResponseIntegrationScheduler,
} from "./processors";
import {
  DisbursementScheduleSharedService,
  RestrictionSharedService,
  SequenceControlService,
  StudentRestrictionSharedService,
  WorkflowClientService,
  ZeebeModule,
  ConfirmationOfEnrollmentService,
  MSFAANumberSharedService,
  GlobalHttpModule,
  AssessmentSequentialProcessingService,
  ClamAVService,
  CASSupplierSharedService,
  FeatureTogglesModule,
} from "@sims/services";
import { DatabaseModule } from "@sims/sims-db";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier12-integration";
import { NotificationsModule } from "@sims/services/notifications";
import { SystemUserModule } from "@sims/services/system-users";
import { MSFAANumberService, SshService } from "@sims/integrations/services";
import {
  ApplicationChangesReportIntegrationModule,
  DisbursementReceiptIntegrationModule,
  ECertIntegrationModule,
  FedRestrictionIntegrationModule,
  MSFAAIntegrationModule,
  SINValidationModule,
  StudentLoanBalancesIntegrationModule,
  ECertCancellationResponseIntegrationModule,
  ReturnedLoansResponseIntegrationModule,
} from "@sims/integrations/esdc-integration";
import { CRAIntegrationModule } from "@sims/integrations/cra-integration/cra-integration.module";
import { T4AIntegrationModule } from "@sims/integrations/t4a";
import {
  StudentAssessmentService,
  ApplicationService,
  WorkflowEnqueuerService,
  StudentFileService,
  CASActiveSupplierNotFoundProcessor,
  CASPreValidationsProcessor,
  CASActiveSupplierFoundProcessor,
  CASActiveSupplierAndSiteFoundProcessor,
  CASKnownErrorsProcessor,
  StudentApplicationNotificationService,
  StudentPDPPDReminderNotification,
  StudentSecondDisbursementReminderNotification,
  StudentCOERequiredNearEndDateReminderNotification,
  MinistryCRAFileProcessingIssueNotification,
  MinistrySINFileProcessingIssueNotification,
  StudentAssessmentReminderNotification,
  CASInvoiceBatchService,
  CASInvoiceService,
  ProgramSuspensionBlockingAssessmentNotification,
} from "./services";
import { SFASIntegrationModule } from "@sims/integrations/sfas-integration";
import { ATBCIntegrationModule } from "@sims/integrations/atbc-integration";
import { ECEIntegrationModule } from "@sims/integrations/institution-integration/ece-integration";
import { HealthController, MetricsController } from "./controllers";
import { MicroserviceHealthIndicator, TerminusModule } from "@nestjs/terminus";
import { CASSupplierIntegrationService } from "./services/cas-supplier/cas-supplier.service";
import { VirusScanProcessor } from "./processors/virus-scan/virus-scan.processor";
import { CASService } from "@sims/integrations/cas/cas.service";
import { ObjectStorageService } from "@sims/integrations/object-storage";
import { BullBoardQueuesModule } from "./bull-board/bull-board-queues.module";
import { QueuesMetricsModule } from "./queues-metrics.module.module";
import { LoggerModule, LoggerService } from "@sims/utilities/logger";
import { ModuleRef } from "@nestjs/core";
import { getQueueToken } from "@nestjs/bullmq";
import { BULL_MQ_MIGRATED_QUEUE_NAMES, JOB_SUFFIX } from "@sims/utilities";
import { Queue } from "bullmq";
// TODO: Removed ATBCResponseIntegrationScheduler in providers, the queuename from enum and the decorators of the processor as part of #2539.
@Module({
  imports: [
    FeatureTogglesModule,
    GlobalHttpModule,
    LoggerModule,
    DatabaseModule,
    QueueModuleLegacy,
    QueueModule,
    BullBoardQueuesModule,
    QueuesMetricsModule,
    ZeebeModule.forRoot(),
    IER12IntegrationModule,
    ECEIntegrationModule,
    NotificationsModule,
    SystemUserModule,
    CRAIntegrationModule,
    SFASIntegrationModule,
    ATBCIntegrationModule,
    DisbursementReceiptIntegrationModule,
    ECertIntegrationModule,
    FedRestrictionIntegrationModule,
    MSFAAIntegrationModule,
    SINValidationModule,
    StudentLoanBalancesIntegrationModule,
    TerminusModule,
    ApplicationChangesReportIntegrationModule,
    ECertCancellationResponseIntegrationModule,
    T4AIntegrationModule,
    ReturnedLoansResponseIntegrationModule,
  ],
  providers: [
    VirusScanProcessor,
    StartApplicationAssessmentProcessor,
    CancelApplicationAssessmentProcessor,
    WorkflowClientService,
    IER12IntegrationScheduler,
    ECEProcessIntegrationScheduler,
    ProcessNotificationScheduler,
    SFASIntegrationScheduler,
    StudentAssessmentService,
    StudentFileService,
    ClamAVService,
    ObjectStorageService,
    SshService,
    QueueService,
    CRAResponseIntegrationScheduler,
    CRAProcessIntegrationScheduler,
    SequenceControlService,
    WorkflowClientService,
    SINValidationProcessIntegrationScheduler,
    SINValidationResponseIntegrationScheduler,
    StudentLoanBalancesPartTimeIntegrationScheduler,
    FullTimeMSFAAProcessIntegrationScheduler,
    MSFAANumberService,
    PartTimeMSFAAProcessIntegrationScheduler,
    PartTimeECertProcessIntegrationScheduler,
    DisbursementScheduleSharedService,
    StudentRestrictionSharedService,
    RestrictionSharedService,
    FullTimeECertProcessIntegrationScheduler,
    FullTimeECertFeedbackIntegrationScheduler,
    PartTimeECertFeedbackIntegrationScheduler,
    DisbursementReceiptsFileIntegrationScheduler,
    FederalRestrictionsIntegrationScheduler,
    FullTimeMSFAAProcessResponseIntegrationScheduler,
    PartTimeMSFAAProcessResponseIntegrationScheduler,
    ProcessArchiveApplicationsScheduler,
    ECEResponseIntegrationScheduler,
    ApplicationService,
    ConfirmationOfEnrollmentService,
    MSFAANumberSharedService,
    AssessmentWorkflowEnqueuerScheduler,
    WorkflowEnqueuerService,
    WorkflowQueueRetryScheduler,
    MicroserviceHealthIndicator,
    AssessmentSequentialProcessingService,
    CASSupplierIntegrationScheduler,
    CASSupplierIntegrationService,
    CASService,
    StudentApplicationNotificationService,
    ApplicationChangesReportIntegrationScheduler,
    StudentApplicationNotificationsScheduler,
    SIMSToSFASIntegrationScheduler,
    CASActiveSupplierNotFoundProcessor,
    CASPreValidationsProcessor,
    CASActiveSupplierFoundProcessor,
    CASActiveSupplierAndSiteFoundProcessor,
    CASKnownErrorsProcessor,
    CASSupplierSharedService,
    StudentPDPPDReminderNotification,
    StudentSecondDisbursementReminderNotification,
    StudentCOERequiredNearEndDateReminderNotification,
    StudentAssessmentReminderNotification,
    ProgramSuspensionBlockingAssessmentNotification,
    MinistryCRAFileProcessingIssueNotification,
    MinistrySINFileProcessingIssueNotification,
    CASInvoiceBatchService,
    CASInvoiceService,
    CASInvoicesBatchesCreationScheduler,
    CASSendInvoicesScheduler,
    ECertCancellationResponseIntegrationScheduler,
    T4AUploadEnqueuerScheduler,
    T4AUploadProcessor,
    ReturnedLoansResponseIntegrationScheduler,
  ],
  controllers: [HealthController, MetricsController],
})
export class QueueConsumersModule implements OnApplicationBootstrap {
  constructor(
    private readonly queueService: QueueService,
    private readonly moduleRef: ModuleRef,
    private readonly logger: LoggerService,
  ) {}
  /**
   * Configure and upsert job schedulers for all queues marked as schedulers.
   */
  async onApplicationBootstrap(): Promise<void> {
    const queues = await this.queueService.getAllQueueConfigurations();
    const schedulerQueueConfigurations = queues.filter(
      (queue) =>
        BULL_MQ_MIGRATED_QUEUE_NAMES.includes(queue.queueName) &&
        queue.isScheduler,
    );
    if (!schedulerQueueConfigurations.length) {
      this.logger.log(`No scheduler queues found.`);
      return;
    }
    for (const schedulerQueueConfig of schedulerQueueConfigurations) {
      const queueName = schedulerQueueConfig.queueName;
      const queueToken = getQueueToken(queueName);
      const schedulerQueue = this.moduleRef.get<Queue>(queueToken, {
        strict: false,
      });
      if (!schedulerQueueConfig.isActive) {
        await schedulerQueue.obliterate({ force: true });
        this.logger.log(`Obliterate inactive queue ${queueName} is complete.`);
        // Skip inactive queues after obliterating the queue.
        continue;
      }
      try {
        await schedulerQueue.upsertJobScheduler(
          `scheduler-${queueName}`,
          schedulerQueueConfig.queueConfiguration.repeatOptions,
          {
            name: `${queueName}${JOB_SUFFIX}`,
            data: schedulerQueueConfig.queueConfiguration.jobData,
          },
        );
        this.logger.log(
          `Upsert job scheduler for queue ${queueName} is complete.`,
        );
      } catch (error: unknown) {
        this.logger.error(
          `Unexpected error occurred while trying to upsert job scheduler for queue ${queueName}.`,
          error,
        );
        throw error;
      }
    }
  }
}
