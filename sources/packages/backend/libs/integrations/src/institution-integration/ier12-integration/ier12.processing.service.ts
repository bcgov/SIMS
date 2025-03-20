import { Injectable } from "@nestjs/common";
import {
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
  FormYesNoOptions,
  FullTimeAssessment,
  RelationshipStatus,
  StudentAssessment,
  StudentRestriction,
} from "@sims/sims-db";
import {
  LoggerService,
  InjectLogger,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { getFileNameAsExtendedCurrentTimestamp } from "@sims/utilities";
import { IER12IntegrationService } from "./ier12.integration.service";
import {
  IER12Record,
  IER12UploadResult,
  IERAddressInfo,
  IERAward,
} from "./models/ier12-integration.model";
import { StudentAssessmentService } from "@sims/integrations/services";
import {
  DisbursementOverawardService,
  AwardOverawardBalance,
} from "@sims/services";
import { FullTimeAwardTypes } from "@sims/integrations/models";
import { PROVINCIAL_DEFAULT_RESTRICTION_CODE } from "@sims/services/constants";
import {
  ApplicationEventCodeUtilsService,
  ApplicationEventDateUtilsService,
} from "./utils-service";

@Injectable()
export class IER12ProcessingService {
  institutionIntegrationConfig: InstitutionIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly ier12IntegrationService: IER12IntegrationService,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly applicationEventCodeUtilsService: ApplicationEventCodeUtilsService,
    private readonly applicationEventDateUtilsService: ApplicationEventDateUtilsService,
  ) {
    this.institutionIntegrationConfig = config.institutionIntegration;
  }

  /**
   * 1. Fetches the assessment data for the institution location.
   * 2. Create the Request content for the IER 12 file by populating the
   * header, footer and trailer content.
   * 3. Create the request filename with the file path with respect to the institution code
   * for the IER 12 sent File.
   * 4. Upload the content to the zoneB SFTP server.
   * @param processSummary process summary for logging.
   * @param generatedDate date in which the assessment for
   * particular institution is generated.
   * @returns processing IER 12 result.
   */
  async processIER12File(
    processSummary: ProcessSummary,
    generatedDate?: string,
  ): Promise<IER12UploadResult[]> {
    processSummary.info("Retrieving pending assessment for IER 12.");
    const pendingAssessments =
      await this.studentAssessmentService.getPendingAssessment(generatedDate);
    if (!pendingAssessments.length) {
      return [];
    }
    processSummary.info(`Found ${pendingAssessments.length} assessment(s).`);
    const fileRecords: Record<string, IER12Record[]> = {};
    for (const assessment of pendingAssessments) {
      const institutionCode =
        assessment.offering.institutionLocation.institutionCode;
      if (!fileRecords[institutionCode]) {
        fileRecords[institutionCode] = [];
      }
      const ier12Records = await this.createIER12Record(assessment);
      fileRecords[institutionCode].push(...ier12Records);
    }
    const uploadResult: IER12UploadResult[] = [];
    try {
      processSummary.info("Creating IER 12 content.");
      for (const [institutionCode, ierRecords] of Object.entries(fileRecords)) {
        const uploadProcessSummary = new ProcessSummary();
        processSummary.children(uploadProcessSummary);
        const ierUploadResult = await this.uploadIER12Content(
          institutionCode,
          ierRecords,
          uploadProcessSummary,
        );
        uploadResult.push(ierUploadResult);
      }
    } catch (error: unknown) {
      const errorMessage = "Error while uploading content for IER 12.";
      this.logger.error(errorMessage, error);
      processSummary.error(errorMessage, error);
    }
    return uploadResult;
  }

  /**
   * Upload the content in SFTP server location.
   * @param institutionCode Institution code for the file generated.
   * @param ier12Records total records for an institution.
   * @param processSummary process summary for logging.
   * @returns Updated records count with filepath.
   */
  async uploadIER12Content(
    institutionCode: string,
    ier12Records: IER12Record[],
    processSummary: ProcessSummary,
  ): Promise<IER12UploadResult> {
    try {
      // Create the Request content for the IER 12 file by populating the content.
      const fileContent =
        this.ier12IntegrationService.createIER12FileContent(ier12Records);
      // Create the request filename with the file path for the each and every institutionCode.
      const fileInfo = this.createRequestFileName(institutionCode);
      processSummary.info("Uploading content.");
      await this.ier12IntegrationService.uploadContent(
        fileContent,
        fileInfo.filePath,
      );
      processSummary.info("Content uploaded.");
      return {
        generatedFile: fileInfo.filePath,
        uploadedRecords: fileContent.length,
      };
    } catch (error: unknown) {
      const errorMessage = "Error while uploading content for IER 12 file.";
      this.logger.error(errorMessage, error);
      processSummary.error(errorMessage, error);
      throw error;
    }
  }

  /**
   * Create file name IER 12 records file.
   * @param institutionCode institutionCode to be a part of the filename.
   * @returns Full file path of the file to be saved on the SFTP.
   */
  createRequestFileName(institutionCode: string): {
    fileName: string;
    filePath: string;
  } {
    const timestamp = getFileNameAsExtendedCurrentTimestamp();
    const fileName = `${institutionCode}-IER12-${timestamp}.txt`;
    const filePath = `${this.institutionIntegrationConfig.ftpRequestFolder}\\${institutionCode}\\${fileName}`;
    return {
      fileName,
      filePath,
    };
  }

  /**
   * Create the Request content for the IER 12 file by populating the content.
   * @param pendingAssessment pending assessment of institutions.
   * @returns IER 12 records for the student assessment.
   */
  private async createIER12Record(
    pendingAssessment: StudentAssessment,
  ): Promise<IER12Record[]> {
    const application = pendingAssessment.application;
    const student = application.student;
    const user = student.user;
    const sinValidation = student.sinValidation;
    const offering = pendingAssessment.offering;
    const educationProgram = offering.educationProgram;
    const address = student.contactInfo.address;
    const applicationProgramYear = application.programYear;
    const [scholasticStanding] = application.studentScholasticStandings;
    const assessmentAwards = this.getAssessmentAwards(
      pendingAssessment.disbursementSchedules,
    );
    const disbursementSchedules = pendingAssessment.disbursementSchedules;
    const addressInfo: IERAddressInfo = {
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      provinceState: address.provinceState,
      postalCode: address.postalCode,
    };
    const hasRestriction = this.checkActiveRestriction(
      student.studentRestrictions,
    );
    const hasProvincialDefaultRestriction = !hasRestriction
      ? false
      : this.checkActiveRestriction(student.studentRestrictions, {
          restrictionCode: PROVINCIAL_DEFAULT_RESTRICTION_CODE,
        });
    const hasPartner =
      pendingAssessment.workflowData.studentData.relationshipStatus ===
      RelationshipStatus.Married;
    const overawardBalance =
      await this.disbursementOverawardService.getOverawardBalance([student.id]);
    const studentOverawardsBalance = overawardBalance[student.id];
    const assessmentData =
      pendingAssessment.assessmentData as FullTimeAssessment;
    const workflowData = pendingAssessment.workflowData;
    const ier12Records: IER12Record[] = [];
    // Create IER12 records per disbursement.
    for (const disbursement of disbursementSchedules) {
      const activeStudentRestriction = student.studentRestrictions
        ?.filter((studentRestriction) => studentRestriction.isActive)
        ?.map((eachRestriction) => eachRestriction.restriction.actionType);
      const applicationEventCode =
        await this.applicationEventCodeUtilsService.getApplicationEventCode(
          application.applicationNumber,
          application.applicationStatus,
          disbursement,
          activeStudentRestriction,
        );
      const [disbursementReceipt] = disbursement.disbursementReceipts;
      const ier12Record: IER12Record = {
        assessmentId: pendingAssessment.id,
        disbursementId: disbursement.id,
        applicationNumber: application.applicationNumber,
        applicationPDStatus: workflowData.calculatedData.pdppdStatus,
        institutionStudentNumber: application.studentNumber,
        sin: sinValidation.sin,
        studentLastName: user.lastName,
        studentGivenName: user.firstName,
        studentBirthDate: new Date(student.birthDate),
        studentDisabilityStatus: student.disabilityStatus,
        studentDependantStatus: workflowData.studentData.dependantStatus,
        addressInfo,
        programName: educationProgram.name,
        programDescription: educationProgram.description,
        credentialType: educationProgram.credentialType,
        fieldOfStudyCode: educationProgram.fieldOfStudyCode,
        currentProgramYear: offering.yearOfStudy,
        cipCode: educationProgram.cipCode,
        nocCode: educationProgram.nocCode,
        sabcCode: educationProgram.sabcCode,
        institutionProgramCode: educationProgram.institutionProgramCode,
        programCompletionYears: educationProgram.completionYears,
        studyStartDate: new Date(offering.studyStartDate),
        studyEndDate: new Date(offering.studyEndDate),
        tuitionFees: offering.actualTuitionCosts,
        booksAndSuppliesCost: offering.programRelatedCosts,
        mandatoryFees: offering.mandatoryFees,
        exceptionExpenses: offering.exceptionalExpenses,
        totalFundedWeeks: assessmentData.weeks,
        applicationSubmittedDate: application.submittedDate,
        programYear: applicationProgramYear.programYear,
        applicationStatus: application.applicationStatus,
        applicationStatusDate: application.applicationStatusUpdatedOn,
        assessmentAwards,
        hasProvincialDefaultRestriction,
        hasProvincialOveraward: this.checkOutstandingOveraward(
          studentOverawardsBalance,
          FullTimeAwardTypes.BCSL,
        ),
        hasFederalOveraward: this.checkOutstandingOveraward(
          studentOverawardsBalance,
          FullTimeAwardTypes.CSLF,
        ),
        hasRestriction,
        assessmentTriggerType: pendingAssessment.triggerType,
        scholasticStandingChangeType: scholasticStanding?.changeType,
        assessmentDate: pendingAssessment.assessmentDate,
        hasPartner,
        parentalAssets: workflowData.calculatedData.parentalAssets,
        coeStatus: disbursement.coeStatus,
        disbursementScheduleStatus: disbursement.disbursementScheduleStatus,
        earliestDateOfDisbursement: new Date(disbursement.disbursementDate),
        dateOfDisbursement: disbursementReceipt?.disburseDate
          ? new Date(disbursementReceipt.disburseDate)
          : null,
        disbursementCancelDate:
          disbursement.disbursementScheduleStatus ===
          DisbursementScheduleStatus.Cancelled
            ? disbursement.updatedAt
            : null,
        disbursementAwards: this.getDisbursementAwards(
          disbursement.disbursementValues,
        ),
        studentMaritalStatusCode:
          workflowData.calculatedData.studentMaritalStatusCode,
        applicantAndPartnerExpectedContribution:
          assessmentData.studentTotalFederalContribution +
          assessmentData.studentTotalProvincialContribution +
          (assessmentData.parentAssessedContribution ?? 0) +
          (assessmentData.partnerAssessedContribution ?? 0),
        totalExpectedContribution: assessmentData.totalProvincialContribution,
        dependantChildQuantity:
          workflowData.calculatedData.dependantChildQuantity,
        dependantChildInDaycareQuantity:
          workflowData.calculatedData.dependantChildInDaycareQuantity,
        dependantInfantQuantity:
          workflowData.calculatedData.dependantInfantQuantity,
        dependantDeclaredOnTaxesQuantity:
          workflowData.calculatedData.dependantDeclaredOnTaxesQuantity,
        dependantPostSecondaryQuantity:
          workflowData.calculatedData.dependantPostSecondaryQuantity,
        parentExpectedContribution: assessmentData.parentAssessedContribution,
        totalEligibleDependents:
          workflowData.calculatedData.totalEligibleDependents,
        familySize: workflowData.calculatedData.familySize,
        numberOfParents: workflowData.studentData.numberOfParents ?? 0,
        parentalAssetContribution:
          workflowData.calculatedData.parentalAssetContribution,
        parentalContribution: workflowData.calculatedData.parentalContribution,
        parentDiscretionaryIncome:
          workflowData.calculatedData.parentDiscretionaryIncome,
        parentalDiscretionaryContribution:
          assessmentData.parentalDiscretionaryContribution,
        studentLivingWithParents:
          workflowData.studentData.livingWithParents === FormYesNoOptions.Yes,
        partnerStudentStudyWeeks:
          workflowData.calculatedData.partnerStudentStudyWeeks ?? 0,
        dependantTotalMSOLAllowance:
          workflowData.calculatedData.dependantTotalMSOLAllowance,
        studentMSOLAllowance: workflowData.calculatedData.studentMSOLAllowance,
        totalLivingAllowance: assessmentData.livingAllowance,
        alimonyCost: assessmentData.alimonyOrChildSupport,
        childcareCost: workflowData.calculatedData.totalChildCareCost,
        totalNonEducationalCost:
          workflowData.calculatedData.totalNonEducationalCost,
        totalAssessedCost: assessmentData.totalAssessedCost,
        totalAssessmentNeed: assessmentData.totalAssessmentNeed,
        disbursementSentDate: disbursement.dateSent,
        applicationEventCode: applicationEventCode,
        applicationEventDate:
          this.applicationEventDateUtilsService.getApplicationEventDate(
            applicationEventCode,
            application,
            disbursement,
          ),
        currentOfferingId: offering.id,
        parentOfferingId: offering.parentOffering?.id,
      };
      ier12Records.push(ier12Record);
    }
    return ier12Records;
  }

  /**
   * Get all disbursement award details for IER.
   * @param disbursementValues disbursement values.
   * @returns award details.
   */
  private getDisbursementAwards(
    disbursementValues: DisbursementValue[],
  ): IERAward[] {
    return disbursementValues.map<IERAward>((disbursementValue) => ({
      valueType: disbursementValue.valueType,
      valueCode: disbursementValue.valueCode,
      valueAmount: disbursementValue.valueAmount,
    }));
  }

  /**
   * Get all disbursement award details for IER of all disbursements that belong
   * to a given assessment.
   * @param disbursementSchedules disbursement schedules.
   * @returns assessment award details.
   */
  private getAssessmentAwards(
    disbursementSchedules: DisbursementSchedule[],
  ): IERAward[] {
    const assessmentAwards = disbursementSchedules.flatMap<IERAward>(
      (disbursementSchedule) => disbursementSchedule.disbursementValues,
    );
    return assessmentAwards;
  }

  /**
   * Check if student has an active restriction.
   * @param studentRestrictions student restrictions
   * @param options check restriction options:
   * - `restrictionCode`: restriction code.
   * @returns value which indicates
   * if a student has active restriction.
   */
  private checkActiveRestriction(
    studentRestrictions: StudentRestriction[],
    options?: { restrictionCode?: string },
  ): boolean {
    return studentRestrictions?.some(
      (studentRestriction) =>
        studentRestriction.isActive &&
        (!options?.restrictionCode ||
          studentRestriction.restriction.restrictionCode ===
            options.restrictionCode),
    );
  }

  /**
   * Check for any outstanding overaward by award type.
   * @param studentOverawardsBalance student overaward balance.
   * @param awardType award type.
   * @returns flag which indicates if there is any outstanding overaward.
   */
  private checkOutstandingOveraward(
    studentOverawardsBalance: AwardOverawardBalance,
    awardType: FullTimeAwardTypes.CSLF | FullTimeAwardTypes.BCSL,
  ): boolean {
    return studentOverawardsBalance
      ? studentOverawardsBalance[awardType] > 0
      : false;
  }

  @InjectLogger()
  logger: LoggerService;
}
