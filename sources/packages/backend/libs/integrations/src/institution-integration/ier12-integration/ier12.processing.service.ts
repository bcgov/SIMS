import { Injectable } from "@nestjs/common";
import {
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
  FormYesNoOptions,
  FullTimeAssessment,
  RelationshipStatus,
  Restriction,
  RestrictionActionType,
  StudentAssessment,
  StudentRestriction,
} from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import {
  addDays,
  getFileNameAsCurrentTimestamp,
  isSameOrAfterDate,
} from "@sims/utilities";
import { IER12IntegrationService } from "./ier12.integration.service";
import {
  ApplicationEventCode,
  CompletedApplicationEventCode,
  CompletedApplicationWithPendingDisbursement,
  CompletedApplicationWithSentDisbursement,
  IER12Record,
  IER12UploadResult,
  IERAddressInfo,
  IERAward,
} from "./models/ier12-integration.model";
import {
  DisbursementScheduleErrorsService,
  DisbursementValueService,
  StudentAssessmentService,
} from "@sims/integrations/services";
import {
  ApplicationSharedService,
  DisbursementOverawardService,
  AwardOverawardBalance,
} from "@sims/services";
import { FullTimeAwardTypes } from "@sims/integrations/models";
import { PROVINCIAL_DEFAULT_RESTRICTION_CODE } from "@sims/services/constants";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "@sims/integrations/constants";

@Injectable()
export class IER12ProcessingService {
  institutionIntegrationConfig: InstitutionIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly ier12IntegrationService: IER12IntegrationService,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly applicationSharedService: ApplicationSharedService,
    private readonly disbursementScheduleErrorsService: DisbursementScheduleErrorsService,
    private readonly disbursementValueService: DisbursementValueService,
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
   * @param generatedDate date in which the assessment for
   * particular institution is generated.
   * @returns Processing IER 12 result.
   */
  async processIER12File(generatedDate?: string): Promise<IER12UploadResult[]> {
    this.logger.log(`Retrieving pending assessment for IER 12...`);
    const pendingAssessments =
      await this.studentAssessmentService.getPendingAssessment(generatedDate);
    if (!pendingAssessments.length) {
      return [
        {
          generatedFile: "none",
          uploadedRecords: 0,
        },
      ];
    }
    this.logger.log(`Found ${pendingAssessments.length} assessments.`);
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
      this.logger.log("Creating IER 12 content...");
      for (const [institutionCode, ierRecords] of Object.entries(fileRecords)) {
        const ierUploadResult = await this.uploadIER12Content(
          institutionCode,
          ierRecords,
        );
        uploadResult.push(ierUploadResult);
      }
    } catch (error) {
      this.logger.error(`Error while uploading content for IER 12: ${error}`);
      // TODO: On error, the error message must added to the upload result and
      // processing must continue for the next institution without aborting.
      throw error;
    }
    return uploadResult;
  }

  /**
   * Upload the content in SFTP server location.
   * @param institutionCode Institution code for the file generated.
   * @param ier12Records total records for an institution.
   * @returns Updated records count with filepath.
   */
  async uploadIER12Content(
    institutionCode: string,
    ier12Records: IER12Record[],
  ): Promise<IER12UploadResult> {
    try {
      // Create the Request content for the IER 12 file by populating the content.
      const fileContent =
        this.ier12IntegrationService.createIER12FileContent(ier12Records);
      // Create the request filename with the file path for the each and every institutionCode.
      const fileInfo = this.createRequestFileName(institutionCode);
      this.logger.log("Uploading content...");
      await this.ier12IntegrationService.uploadContent(
        fileContent,
        fileInfo.filePath,
      );
      this.logger.log("Content uploaded.");
      return {
        generatedFile: fileInfo.filePath,
        uploadedRecords: fileContent.length,
      };
    } catch (error) {
      this.logger.error(
        `Error while uploading content for IER 12 file: ${error}`,
      );
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
    const timestamp = getFileNameAsCurrentTimestamp();
    const fileName = `IER_012_${timestamp}.txt`;
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
      const [disbursementReceipt] = disbursement.disbursementReceipts;
      const ier12Record: IER12Record = {
        assessmentId: pendingAssessment.id,
        disbursementId: disbursement.id,
        applicationNumber: application.applicationNumber,
        institutionStudentNumber: application.data.studentNumber,
        sin: sinValidation.sin,
        studentLastName: user.lastName,
        studentGivenName: user.firstName,
        studentBirthDate: new Date(student.birthDate),
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
        studentAndSupportingUserContribution:
          assessmentData.studentTotalFederalContribution +
          assessmentData.studentTotalProvincialContribution +
          (assessmentData.parentAssessedContribution ?? 0) +
          (assessmentData.partnerAssessedContribution ?? 0),
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
        applicationEventCode: await this.getApplicationEventCode(
          application.applicationNumber,
          application.applicationStatus,
          disbursement,
          activeStudentRestriction,
        ),
      };
      ier12Records.push(ier12Record);
    }
    return ier12Records;
  }

  /**
   * Get application event code (i.e current state of an application)
   * @param applicationNumber application number.
   * @param applicationStatus application status.
   * @param currentDisbursementSchedule current disbursement schedule.
   * @param activeRestrictionsActionTypes action types for active student restrictions.
   * @returns application event code.
   */
  private async getApplicationEventCode(
    applicationNumber: string,
    applicationStatus: ApplicationStatus,
    currentDisbursementSchedule: Pick<
      DisbursementSchedule,
      "id" | "coeStatus" | "disbursementDate" | "disbursementScheduleStatus"
    >,
    activeRestrictionsActionTypes?: RestrictionActionType[][],
  ): Promise<ApplicationEventCode> {
    switch (applicationStatus) {
      case ApplicationStatus.Assessment:
        return this.applicationEventCodeDuringAssessment(applicationNumber);

      case ApplicationStatus.Enrolment:
        return this.applicationEventCodeDuringEnrolmentAndCompleted(
          currentDisbursementSchedule.coeStatus,
        );
      case ApplicationStatus.Completed:
        return this.applicationEventCodeDuringCompleted(
          currentDisbursementSchedule,
          activeRestrictionsActionTypes,
        );
      case ApplicationStatus.Cancelled:
        return ApplicationEventCode.DISC;
    }
  }

  /**
   * Get application event code for an application with assessment status.
   * @param applicationNumber application number.
   * @returns application event code.
   */
  private async applicationEventCodeDuringAssessment(
    applicationNumber: string,
  ): Promise<ApplicationEventCode.REIA | ApplicationEventCode.ASMT> {
    // Check if the application has more than one submissions.
    const hasMultipleApplicationSubmissions =
      await this.applicationSharedService.hasMultipleApplicationSubmissions(
        applicationNumber,
      );
    return hasMultipleApplicationSubmissions
      ? ApplicationEventCode.REIA
      : ApplicationEventCode.ASMT;
  }

  /**
   * Get application event code for an application with enrollment/completed status.
   * @param coeStatus coe status.
   * @returns application event code.
   */
  private applicationEventCodeDuringEnrolmentAndCompleted(
    coeStatus: COEStatus,
  ): ApplicationEventCode.COER | ApplicationEventCode.COED {
    switch (coeStatus) {
      case COEStatus.required:
        return ApplicationEventCode.COER;
      case COEStatus.declined:
        return ApplicationEventCode.COED;
      default:
        throw "Unexpected coe status.";
    }
  }

  /**
   * Get application event code for an application with completed status.
   * @param currentDisbursementSchedule current disbursement schedule.
   * @param activeRestrictionsActionTypes action types for active student restrictions.
   * @returns application event code.
   */
  private async applicationEventCodeDuringCompleted(
    currentDisbursementSchedule: Pick<
      DisbursementSchedule,
      "id" | "coeStatus" | "disbursementDate" | "disbursementScheduleStatus"
    >,
    activeRestrictionsActionTypes?: RestrictionActionType[][],
  ): Promise<CompletedApplicationEventCode> {
    switch (currentDisbursementSchedule.disbursementScheduleStatus) {
      case DisbursementScheduleStatus.Cancelled:
        return ApplicationEventCode.DISC;
      case DisbursementScheduleStatus.Pending:
        return this.eventCodeForCompletedApplicationWithPendingDisbursement(
          currentDisbursementSchedule,
          activeRestrictionsActionTypes,
        );
      case DisbursementScheduleStatus.Sent:
        return this.eventCodeForCompletedApplicationWithSentDisbursement(
          currentDisbursementSchedule.id,
        );
    }
  }

  /**
   * Get application event code for an application with completed status
   * with sent disbursement and with no feedback errors and any disbursement
   * award (full amount or a partial) was withheld due to a restriction.
   * @param currentDisbursementScheduleId current disbursement schedule id.
   * @returns application event code.
   */
  private async eventCodeForCompletedApplicationWithAwardWithheldDueToRestriction(
    currentDisbursementScheduleId: number,
  ): Promise<ApplicationEventCode.DISW | ApplicationEventCode.DISS> {
    // Check if any disbursement award (full amount or a partial)
    // was withheld due to a restriction.
    const hasAwardWithheldDueToRestriction =
      await this.disbursementValueService.hasAwardWithheldDueToRestriction(
        currentDisbursementScheduleId,
      );
    return hasAwardWithheldDueToRestriction
      ? ApplicationEventCode.DISW
      : ApplicationEventCode.DISS;
  }

  /**
   * Get application event code for an application with completed status
   * with sent disbursement.
   * @param currentDisbursementScheduleId current disbursement schedule id.
   * @returns application event code.
   */
  private async eventCodeForCompletedApplicationWithSentDisbursement(
    currentDisbursementScheduleId: number,
  ): Promise<CompletedApplicationWithSentDisbursement> {
    // Check if the disbursement has any feedback error.
    const hasFullTimeDisbursementFeedbackErrors =
      await this.disbursementScheduleErrorsService.hasFullTimeDisbursementFeedbackErrors(
        currentDisbursementScheduleId,
      );
    return hasFullTimeDisbursementFeedbackErrors
      ? ApplicationEventCode.DISE
      : this.eventCodeForCompletedApplicationWithAwardWithheldDueToRestriction(
          currentDisbursementScheduleId,
        );
  }

  /**
   * Checks if there is any active stop full time disbursement restriction
   * for a student.
   * @param activeRestrictionsActionTypes action types for active student restrictions.
   * @returns true if there is any active stop full time disbursement
   * restriction for a student.
   */
  private hasActiveStopFullTimeDisbursement(
    activeRestrictionsActionTypes?: RestrictionActionType[][],
  ): boolean {
    return activeRestrictionsActionTypes?.some((actionType) =>
      actionType?.includes(RestrictionActionType.StopFullTimeDisbursement),
    );
  }

  /**
   * Get application event code for an application with completed status
   * with pending disbursement and completed COE.
   * @param disbursementDate disbursement date.
   * @param activeRestrictionsActionTypes action types for active student restrictions.
   * @returns application event code.
   */
  private eventCodeForCompletedApplicationWithPendingDisbursementAndCompletedCOE(
    disbursementDate: string,
    activeRestrictionsActionTypes?: RestrictionActionType[][],
  ): ApplicationEventCode.DISR | ApplicationEventCode.COEA {
    // Check if disbursement is not sent due to restriction.
    if (
      isSameOrAfterDate(
        disbursementDate,
        addDays(DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS),
      )
    ) {
      const hasActiveStopFullTimeDisbursement =
        this.hasActiveStopFullTimeDisbursement(activeRestrictionsActionTypes);
      return hasActiveStopFullTimeDisbursement
        ? ApplicationEventCode.DISR
        : ApplicationEventCode.COEA;
    }
    return ApplicationEventCode.COEA;
  }

  /**
   * Get application event code for an application with completed status
   * with pending disbursement.
   * @param currentDisbursementSchedule current disbursement schedule.
   * @param activeRestrictionsActionTypes action types for active student restrictions.
   * @returns application event code.
   */
  private eventCodeForCompletedApplicationWithPendingDisbursement(
    currentDisbursementSchedule: Pick<
      DisbursementSchedule,
      "coeStatus" | "disbursementDate"
    >,
    activeRestrictionsActionTypes?: RestrictionActionType[][],
  ): CompletedApplicationWithPendingDisbursement {
    if (currentDisbursementSchedule.coeStatus === COEStatus.completed) {
      return this.eventCodeForCompletedApplicationWithPendingDisbursementAndCompletedCOE(
        currentDisbursementSchedule.disbursementDate,
        activeRestrictionsActionTypes,
      );
    }
    // COE status required and declined will come here.
    // COE status is required - Completed applications can have second COE, waiting for confirmation
    // on original assessment and anu COE waiting for confirmation on re-assessment.
    // COE status is declined - Completed application can have a second COE declined on original assessment
    // and any COE declined on re-assessment.
    return this.applicationEventCodeDuringEnrolmentAndCompleted(
      currentDisbursementSchedule.coeStatus,
    );
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
