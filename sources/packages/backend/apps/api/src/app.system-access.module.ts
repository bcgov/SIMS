import { Module } from "@nestjs/common";
import {
  ATBCService,
  StudentService,
  ApplicationExceptionService,
  EducationProgramOfferingService,
  StudentAssessmentService,
  StudentRestrictionService,
  RestrictionService,
  SupportingUserService,
  CRAIncomeVerificationService,
  ApplicationService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  StudentFileService,
  SFASIndividualService,
  SFASRestrictionService,
  DisbursementReceiptService,
  InstitutionLocationService,
  DesignationAgreementLocationService,
  EducationProgramService,
  EducationProgramOfferingValidationService,
  StudentAppealService,
  StudentAppealRequestsService,
  StudentScholasticStandingsService,
} from "./services";
import {
  AssessmentControllerService,
  ApplicationSystemAccessController,
  MSFAAIntegrationSystemAccessController,
  SFASIntegrationSystemAccessController,
  ATBCSystemAccessController,
} from "./route-controllers";
import {
  WorkflowClientService,
  SequenceControlService,
  DisbursementSchedulerService,
} from "@sims/services";
// todo: once all integration are moved. remove sshservice.
import { SshService } from "@sims/integrations/services";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier12-integration/ier12-integration.module";
import { ReportService } from "@sims/integrations/services/report/report.service";
import { FederalRestrictionService } from "@sims/integrations/services/restriction/federal-restriction.service";
import { DisbursementScheduleErrorsService } from "@sims/integrations/services/disbursement-schedule-errors/disbursement-schedule-errors.service";
import { MSFAANumberService } from "@sims/integrations/services/msfaa-number/msfaa-number.service";
import { StudentRestrictionService as StudentRestrictionsService } from "@sims/integrations/services/restriction/student-restriction.service";
import { SystemUsersService } from "@sims/services/system-users";
import { AuthModule } from "./auth/auth.module";
import { SINValidationModule } from "@sims/integrations/esdc-integration/sin-validation/sin-validation.module";
import { MSFAARequestService } from "@sims/integrations/esdc-integration/msfaa-integration/msfaa-request.service";
import { MSFAAIntegrationService } from "@sims/integrations/esdc-integration/msfaa-integration/msfaa-integration.service";
import { MSFAAResponseService } from "@sims/integrations/esdc-integration/msfaa-integration/msfaa-response.service";
import { SFASIntegrationProcessingService } from "./sfas-integration/sfas-integration-processing.service";
import { SFASIntegrationService } from "./sfas-integration/sfas-integration.service";
import { ECertFileHandler } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-file-handler";
import { ECertFullTimeIntegrationService } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-full-time-integration/e-cert-full-time-integration.service";
import { ECertPartTimeIntegrationService } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-part-time-integration/e-cert-part-time-integration.service";
import { ECertFullTimeFileHeader } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-full-time-integration/e-cert-files/e-cert-file-header";
import { ECertFullTimeFileFooter } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-full-time-integration/e-cert-files/e-cert-file-footer";
import { ECertPartTimeFileHeader } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-part-time-integration/e-cert-files/e-cert-file-header";
import { ECertPartTimeFileFooter } from "@sims/integrations/esdc-integration/e-cert-integration/e-cert-part-time-integration/e-cert-files/e-cert-file-footer";
import { DisbursementReceiptProcessingService } from "@sims/integrations/esdc-integration/disbursement-receipt-integration/disbursement-receipt-processing.service";
import { DisbursementReceiptIntegrationService } from "@sims/integrations/esdc-integration/disbursement-receipt-integration/disbursement-receipt-integration.service";
import { DisbursementReceiptRequestService } from "@sims/integrations/esdc-integration/disbursement-receipt-integration/disbursement-receipt-request.service";
import { FedRestrictionProcessingService } from "@sims/integrations/esdc-integration/fed-restriction-integration/fed-restriction-processing.service";
import { FedRestrictionIntegrationService } from "@sims/integrations/esdc-integration/fed-restriction-integration/fed-restriction-integration.service";
import { DisbursementSchedulerService as DisbursementsScheduleService } from "@sims/integrations/services/disbursement-schedule-service/disbursement-schedule-service";
// todo: ann module part3 when schdulers are done, remember to reovethe service used in the deleted controllers
import { DisbursementReceiptService as DisbursementReceiptsService } from "@sims/integrations/services/disbursement-receipt/disbursement-receipt.service";
import { RestrictionService as RestrictionsService } from "@sims/integrations/services/restriction/restriction.service";

@Module({
  imports: [AuthModule, SINValidationModule, IER12IntegrationModule],
  controllers: [
    ATBCSystemAccessController,
    ApplicationSystemAccessController,
    MSFAAIntegrationSystemAccessController,
    SFASIntegrationSystemAccessController,
  ],
  providers: [
    WorkflowClientService,
    ATBCService,
    StudentService,
    StudentAssessmentService,
    EducationProgramOfferingService,
    DisbursementSchedulerService,
    SequenceControlService,
    StudentRestrictionService,
    AssessmentControllerService,
    RestrictionService,
    ApplicationExceptionService,
    SupportingUserService,
    CRAIncomeVerificationService,
    ApplicationService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    StudentFileService,
    MSFAANumberService,
    SshService,
    MSFAARequestService,
    MSFAAIntegrationService,
    MSFAAResponseService,
    SFASIntegrationProcessingService,
    SFASIntegrationService,
    SFASIndividualService,
    SFASRestrictionService,
    ECertFileHandler,
    DisbursementScheduleErrorsService,
    ECertFullTimeIntegrationService,
    ECertPartTimeIntegrationService,
    ECertFullTimeFileHeader,
    ECertFullTimeFileFooter,
    ECertPartTimeFileHeader,
    ECertPartTimeFileFooter,
    DisbursementReceiptProcessingService,
    DisbursementReceiptIntegrationService,
    DisbursementReceiptService,
    DisbursementReceiptRequestService,
    ReportService,
    FedRestrictionProcessingService,
    FederalRestrictionService,
    FedRestrictionIntegrationService,
    InstitutionLocationService,
    DesignationAgreementLocationService,
    EducationProgramService,
    EducationProgramOfferingValidationService,
    StudentAppealService,
    StudentAppealRequestsService,
    StudentScholasticStandingsService,
    // todo: ann review the StudentRestrictionsService
    StudentRestrictionsService,
    SystemUsersService,
    DisbursementsScheduleService,
    DisbursementReceiptsService,
    RestrictionsService,
  ],
})
export class AppSystemAccessModule {}
