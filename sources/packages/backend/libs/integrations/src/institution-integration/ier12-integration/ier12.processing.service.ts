import { Injectable } from "@nestjs/common";
import {
  Application,
  DisbursementScheduleStatus,
  DisbursementValue,
  FormYesNoOptions,
  FullTimeAssessment,
  RelationshipStatus,
  StudentRestriction,
} from "@sims/sims-db";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import {
  addDays,
  getFileNameAsExtendedCurrentTimestamp,
  getISODateOnlyString,
} from "@sims/utilities";
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
import {
  FEDERAL_DEFAULT_RESTRICTION_CODES,
  PROVINCIAL_DEFAULT_RESTRICTION_CODES,
} from "@sims/services/constants";
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
    private readonly logger: LoggerService,
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
   * @param modifiedSince date for which the IER 12 file is generated.
   * @returns processing IER 12 result.
   */
  async processIER12File(
    processSummary: ProcessSummary,
    modifiedSince?: string,
    institutionCode?: string,
  ): Promise<IER12UploadResult[]> {
    // Validate job data.
    if (modifiedSince !== undefined) {
      const oneYearAgo = addDays(-365, getISODateOnlyString(new Date()));
      if (new Date(modifiedSince) < new Date(oneYearAgo)) {
        processSummary.info(
          "Modified since date cannot be more than one year in the past.",
        );
      }
    }
    if (institutionCode !== undefined && institutionCode.length !== 4) {
      processSummary.info(
        `Job data institutionCode must be exactly 4 characters.`,
      );
      return [];
    }

    processSummary.info(
      `Retrieving application current assessment details for IER 12${this.displayInstitutionCode(institutionCode)}.`,
    );
    // By default, the modifiedSince date is the previous day from today.
    const today = getISODateOnlyString(new Date());
    const modifiedSinceDate = modifiedSince
      ? new Date(modifiedSince)
      : addDays(-1, today);
    // If a modifiedSince date is provided, the modifiedUntilDate include all data up until the execution time to ensure that a current snapshot is sent.
    // If not provided, the modifiedUntilDate is set to start of day today so that the default execution sends exactly one day of data.
    const modifiedUntilDate = modifiedSince ? new Date() : new Date(today);
    processSummary.info(
      `Retrieving data related to IER 12 created or modified between ${modifiedSinceDate} and ${modifiedUntilDate}${this.displayInstitutionCode(institutionCode)}.`,
    );
    const pendingApplications =
      await this.studentAssessmentService.getPendingApplicationsCurrentAssessment(
        modifiedSinceDate,
        modifiedUntilDate,
        institutionCode,
      );
    if (!pendingApplications.length) {
      processSummary.info(
        `No assessments found for IER 12${this.displayInstitutionCode(institutionCode)}.`,
      );
      return [];
    }
    processSummary.info(
      `Found ${pendingApplications.length} assessment(s)${this.displayInstitutionCode(institutionCode)}.`,
    );
    const pendingApplicationIds = pendingApplications.map(
      (application) => application.id,
    );
    // Get application award details only for pending applications to populate IER 12 award values.
    const applicationAwardTotals =
      await this.studentAssessmentService.getDisbursementAwardTotalsForApplications(
        pendingApplicationIds,
      );
    const fileRecords: Record<string, IER12Record[]> = {};
    for (const application of pendingApplications) {
      const institutionCode =
        application.currentAssessment!.offering!.institutionLocation
          .institutionCode!;
      if (!fileRecords[institutionCode]) {
        fileRecords[institutionCode] = [];
      }
      const ier12Records = await this.createIER12Record(
        application,
        applicationAwardTotals.get(application.id) ?? [],
      );
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
      const errorMessage = `Error while uploading content for IER 12${this.displayInstitutionCode(institutionCode)}.`;
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
    const filePath = `${this.institutionIntegrationConfig.ftpRequestFolder}\\${fileName}`;
    return {
      fileName,
      filePath,
    };
  }

  /**
   * Create the Request content for the IER 12 file by populating the content.
   * Only disbursements modified within the requested date range are written to
   * the IER12 file. The awards map is used to populate the total assessment
   * award values for each record.
   * @param application application and its current assessment.
   * @param assessmentAwards list of all awards from all disbursements associated with the current application's assessment.
   * @returns IER 12 records for the student assessment.
   */
  private async createIER12Record(
    application: Application,
    assessmentAwards: IERAward[],
  ): Promise<IER12Record[]> {
    const pendingAssessment = application.currentAssessment;
    const student = application.student;
    const user = student.user;
    const sinValidation = student.sinValidation;
    const offering = pendingAssessment.offering;
    const educationProgram = offering.educationProgram;
    const address = student.contactInfo.address;
    const applicationProgramYear = application.programYear;
    const [scholasticStanding] = application.studentScholasticStandings;
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
          restrictionCodes: PROVINCIAL_DEFAULT_RESTRICTION_CODES,
        });
    const hasFederalDefaultRestriction = !hasRestriction
      ? false
      : this.checkActiveRestriction(student.studentRestrictions, {
          restrictionCodes: FEDERAL_DEFAULT_RESTRICTION_CODES,
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
        hasFederalDefaultRestriction,
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
          workflowData.calculatedData.totalProvincialFSC +
          workflowData.calculatedData.totalTargetedResources +
          (workflowData.calculatedData.totalSpouseContribution ?? 0),
        totalExpectedContribution: assessmentData.totalProvincialContribution,
        dependantChildQuantity:
          (workflowData.calculatedData.dependantChildInDaycareQuantity ?? 0) +
          (workflowData.calculatedData.dependantInfantQuantity ?? 0) +
          (workflowData.calculatedData.dependantChildQuantity ?? 0),
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
        partnerStudyWeeks: workflowData.calculatedData.partnerStudyWeeks ?? 0,
        dependantTotalMSOLAllowance:
          workflowData.calculatedData.dependantTotalMSOLAllowance,
        studentMSOLAllowance: workflowData.calculatedData.studentMSOLAllowance,
        totalLivingAllowance: assessmentData.livingAllowance,
        alimonyCost: assessmentData.alimonyOrChildSupport,
        childcareCost: workflowData.calculatedData.totalChildCareCost,
        totalNonEducationalCost:
          workflowData.calculatedData.totalNonEducationalCost,
        totalAssessedCost: assessmentData.totalAssessedCost,
        totalAssessmentNeed: assessmentData.provincialAssessmentNeed,
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
        returnTransportationCosts:
          workflowData.calculatedData.returnTransportationCost,
        extraLocalTransportationCosts:
          workflowData.calculatedData.totalAdditionalTransportationAllowance,
        extraShelterCosts: workflowData.calculatedData.totalRoomAndBoardAmount,
        interfacePolicyApplies:
          workflowData.calculatedData.interfacePolicyApplies,
        interfaceNeed: workflowData.calculatedData.interfaceNeed,
        interfaceChildCareCosts:
          workflowData.calculatedData.interfaceChildCareCosts,
        interfaceEducationCosts:
          workflowData.calculatedData.interfaceEducationCosts,
        interfaceTransportationAmount:
          workflowData.calculatedData.interfaceTransportationAmount,
        interfaceAdditionalTransportationAmount:
          workflowData.calculatedData.interfaceAdditionalTransportationAmount,
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
   * Check if student has an active restriction.
   * @param studentRestrictions student restrictions
   * @param options check restriction options:
   * - `restrictionCodes`: restriction codes.
   * @returns value which indicates
   * if a student has active restriction.
   */
  private checkActiveRestriction(
    studentRestrictions: StudentRestriction[],
    options?: { restrictionCodes?: string[] },
  ): boolean {
    return studentRestrictions?.some(
      (studentRestriction) =>
        studentRestriction.isActive &&
        (!options?.restrictionCodes?.length ||
          options.restrictionCodes.includes(
            studentRestriction.restriction.restrictionCode,
          )),
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

  /**
   * Helper method to display institution code in the log messages if provided.
   * @param institutionCode institution code to be displayed in the log message.
   * @returns formatted string with institution code if provided, otherwise an empty string.
   */
  private displayInstitutionCode(institutionCode?: string): string {
    return institutionCode ? ` with institution code ${institutionCode}` : "";
  }
}
