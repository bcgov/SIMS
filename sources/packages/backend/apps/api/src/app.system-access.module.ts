import { Module } from "@nestjs/common";
import {
  StudentService,
  ApplicationExceptionService,
  DisbursementScheduleService,
  EducationProgramOfferingService,
  StudentAssessmentService,
  StudentRestrictionService,
  RestrictionService,
  SupportingUserService,
  CRAIncomeVerificationService,
  ApplicationService,
  StudentFileService,
  MSFAANumberService,
  DisbursementScheduleErrorsService,
  DisbursementReceiptService,
  ReportService,
  FederalRestrictionService,
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
  ECertIntegrationSystemAccessController,
  FedRestrictionsIntegrationSystemAccessController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { SINValidationModule } from "./esdc-integration/sin-validation/sin-validation.module";
import { SINValidationSystemAccessController } from "./route-controllers/esdc-integration/sin-validation.system-access.controller";
import { MSFAARequestService } from "./esdc-integration/msfaa-integration/msfaa-request.service";
import { MSFAAIntegrationService } from "./esdc-integration/msfaa-integration/msfaa-integration.service";
import { MSFAAResponseService } from "./esdc-integration/msfaa-integration/msfaa-response.service";
import { ECertFileHandler } from "./esdc-integration/e-cert-integration/e-cert-file-handler";
import { ECertFullTimeIntegrationService } from "./esdc-integration/e-cert-integration/e-cert-full-time-integration/e-cert-full-time-integration.service";
import { ECertPartTimeIntegrationService } from "./esdc-integration/e-cert-integration/e-cert-part-time-integration/e-cert-part-time-integration.service";
import { ECertFullTimeFileHeader } from "./esdc-integration/e-cert-integration/e-cert-full-time-integration/e-cert-files/e-cert-file-header";
import { ECertFullTimeFileFooter } from "./esdc-integration/e-cert-integration/e-cert-full-time-integration/e-cert-files/e-cert-file-footer";
import { ECertPartTimeFileHeader } from "./esdc-integration/e-cert-integration/e-cert-part-time-integration/e-cert-files/e-cert-file-header";
import { ECertPartTimeFileFooter } from "./esdc-integration/e-cert-integration/e-cert-part-time-integration/e-cert-files/e-cert-file-footer";
import { DisbursementReceiptProcessingService } from "./esdc-integration/disbursement-receipt-integration/disbursement-receipt-processing.service";
import { DisbursementReceiptIntegrationService } from "./esdc-integration/disbursement-receipt-integration/disbursement-receipt-integration.service";
import { DisbursementReceiptRequestService } from "./esdc-integration/disbursement-receipt-integration/disbursement-receipt-request.service";
import { FedRestrictionProcessingService } from "./esdc-integration/fed-restriction-integration/fed-restriction-processing.service";
import { FedRestrictionIntegrationService } from "./esdc-integration/fed-restriction-integration/fed-restriction-integration.service";
import { WorkflowClientService, SequenceControlService } from "@sims/services";
// todo: once all integration are moved. remove sshservice.
import { SshService } from "@sims/integrations/services";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
} from "@sims/services/sfas";
import { IER12IntegrationModule } from "@sims/integrations/institution-integration/ier12-integration/ier12-integration.module";

@Module({
  imports: [AuthModule, SINValidationModule, IER12IntegrationModule],
  controllers: [
    SINValidationSystemAccessController,
    ApplicationSystemAccessController,
    MSFAAIntegrationSystemAccessController,
    ECertIntegrationSystemAccessController,
    FedRestrictionsIntegrationSystemAccessController,
  ],
  providers: [
    WorkflowClientService,
    StudentService,
    StudentAssessmentService,
    EducationProgramOfferingService,
    DisbursementScheduleService,
    SequenceControlService,
    StudentRestrictionService,
    AssessmentControllerService,
    RestrictionService,
    ApplicationExceptionService,
    SupportingUserService,
    CRAIncomeVerificationService,
    ApplicationService,
    StudentFileService,
    MSFAANumberService,
    SshService,
    MSFAARequestService,
    MSFAAIntegrationService,
    MSFAAResponseService,
    SFASIndividualService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
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
  ],
})
export class AppSystemAccessModule {}
