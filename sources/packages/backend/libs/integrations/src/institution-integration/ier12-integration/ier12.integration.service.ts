import { Injectable } from "@nestjs/common";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { IER12FileDetail } from "./ier12-file-detail";
import {
  ApplicationStatusCode,
  IER12FileLine,
  IER12Record,
  IERAward,
  ScholasticStandingCode,
} from "./models/ier12-integration.model";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  DisbursementValueType,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import {
  combineDecimalPlaces,
  getStudentDisabilityStatusCode,
  getTotalYearsOfStudy,
  replaceLineBreaks,
} from "@sims/utilities";
import { YNFlag } from "@sims/integrations/models";

/**
 * Manages the creation of the content files that needs to be sent
 * to IER 12. These files are created based
 * on a fixed size format and uploaded to a SFTP on Government
 * ZONE B network for further processing and final send to servers.
 */
@Injectable()
export class IER12IntegrationService extends SFTPIntegrationBase<void> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
  }
  /**
   * Create the IER 12 content, by populating the records.
   * @param ier12Records - Assessment, Student, User, offering,
   * program and application objects data.
   * @returns Complete IERFileLines record as an array.
   */
  createIER12FileContent(ier12Records: IER12Record[]): IER12FileLine[] {
    const ierFileLines: IER12FileLine[] = [];
    const fileRecords = ier12Records.map((ierRecord) => {
      const ierFileDetail = new IER12FileDetail();
      ierFileDetail.assessmentId = ierRecord.assessmentId;
      ierFileDetail.disbursementId = ierRecord.disbursementId;
      ierFileDetail.applicationNumber = ierRecord.applicationNumber;
      ierFileDetail.applicationDisabilityStatusFlag = this.convertToYNFlag(
        ierRecord.applicationPDStatus,
      );
      ierFileDetail.institutionStudentNumber =
        ierRecord.institutionStudentNumber;
      ierFileDetail.sin = ierRecord.sin;
      ierFileDetail.studentLastName = ierRecord.studentLastName;
      ierFileDetail.studentGivenName = ierRecord.studentGivenName;
      ierFileDetail.studentBirthDate = ierRecord.studentBirthDate;
      ierFileDetail.studentDisabilityStatusCode =
        getStudentDisabilityStatusCode(ierRecord.studentDisabilityStatus);
      ierFileDetail.studentGroupCode =
        ierRecord.studentDependantStatus === "dependant" ? "A" : "B";
      ierFileDetail.studentMaritalStatusCode =
        ierRecord.studentMaritalStatusCode;
      ierFileDetail.addressInfo = ierRecord.addressInfo;
      ierFileDetail.programName = ierRecord.programName;
      ierFileDetail.programDescription = replaceLineBreaks(
        ierRecord.programDescription,
      );
      ierFileDetail.credentialType = ierRecord.credentialType;
      ierFileDetail.fieldOfStudyCode = ierRecord.fieldOfStudyCode;
      ierFileDetail.levelOfStudyCode = this.getLevelOfStudyCode(
        ierRecord.credentialType,
      );
      ierFileDetail.currentProgramYear = ierRecord.currentProgramYear;
      // Removing the given character as per IER 12 specification.
      ierFileDetail.cipCode = ierRecord.cipCode.replace(".", "");
      ierFileDetail.nocCode = ierRecord.nocCode;
      ierFileDetail.sabcCode = ierRecord.sabcCode;
      ierFileDetail.institutionProgramCode = ierRecord.institutionProgramCode;
      ierFileDetail.programLength = getTotalYearsOfStudy(
        ierRecord.programCompletionYears,
      );
      ierFileDetail.studyStartDate = ierRecord.studyStartDate;
      ierFileDetail.studyEndDate = ierRecord.studyEndDate;
      ierFileDetail.tuitionFees = combineDecimalPlaces(ierRecord.tuitionFees);
      ierFileDetail.booksAndSuppliesCost = combineDecimalPlaces(
        ierRecord.booksAndSuppliesCost,
      );
      ierFileDetail.mandatoryFees = combineDecimalPlaces(
        ierRecord.mandatoryFees,
      );
      ierFileDetail.exceptionExpenses = combineDecimalPlaces(
        ierRecord.exceptionExpenses,
      );
      ierFileDetail.totalFundedWeeks = ierRecord.totalFundedWeeks;
      ierFileDetail.courseLoad = 100; // Hard coded as IER12 currently includes full time applications only.
      ierFileDetail.offeringIntensityIndicator = "F"; // Hard coded as IER12 currently includes full time applications only.
      ierFileDetail.applicationSubmittedDate =
        ierRecord.applicationSubmittedDate;
      // Removing the given character as per IER 12 specification.
      ierFileDetail.programYear = ierRecord.programYear.replace("-", "");
      ierFileDetail.applicationStatusCode = this.getApplicationStatusCode(
        ierRecord.applicationStatus,
      );
      ierFileDetail.applicationStatusDate = ierRecord.applicationStatusDate;
      // Sum of all canada loan awards which belongs to an assessment.
      ierFileDetail.cslAmount = this.getSumOfAwards(
        ierRecord.assessmentAwards,
        { awardTypeInclusions: [DisbursementValueType.CanadaLoan] },
      );
      // Sum of all BC loan awards which belongs to an assessment.
      ierFileDetail.bcslAmount = this.getSumOfAwards(
        ierRecord.assessmentAwards,
        { awardTypeInclusions: [DisbursementValueType.BCLoan] },
      );
      // Sum of all grant awards which belongs to an assessment.
      ierFileDetail.epAmount = this.getSumOfAwards(ierRecord.assessmentAwards, {
        awardTypeExclusions: [
          DisbursementValueType.CanadaLoan,
          DisbursementValueType.BCLoan,
          DisbursementValueType.BCTotalGrant,
        ],
      });
      ierFileDetail.provincialDefaultFlag = this.convertToYNFlag(
        ierRecord.hasProvincialDefaultRestriction,
      );
      ierFileDetail.federalDefaultFlag = this.convertToYNFlag(
        ierRecord.hasFederalDefaultRestriction,
      );
      ierFileDetail.provincialOverawardFlag = this.convertToYNFlag(
        ierRecord.hasProvincialOveraward,
      );
      ierFileDetail.federalOverawardFlag = this.convertToYNFlag(
        ierRecord.hasFederalOveraward,
      );
      ierFileDetail.restrictionFlag = this.convertToYNFlag(
        ierRecord.hasRestriction,
      );
      ierFileDetail.scholasticStandingEffectiveDate =
        this.getScholasticStandingEffectiveDate(
          ierRecord.assessmentTriggerType,
          ierRecord.scholasticStandingChangeType,
          ierRecord.studyEndDate,
        );
      ierFileDetail.scholasticStandingCode = this.getScholasticStandingCode(
        ierRecord.assessmentTriggerType,
        ierRecord.scholasticStandingChangeType,
      );
      ierFileDetail.assessmentDate = ierRecord.assessmentDate;
      ierFileDetail.withdrawalDate = this.getWithdrawalDate(
        ierRecord.assessmentTriggerType,
        ierRecord.scholasticStandingChangeType,
        ierRecord.studyEndDate,
      );
      ierFileDetail.applicantAndPartnerExpectedContribution =
        combineDecimalPlaces(ierRecord.applicantAndPartnerExpectedContribution);
      ierFileDetail.parentExpectedContribution =
        this.combineDecimalPlacesOptional(ierRecord.parentExpectedContribution);
      ierFileDetail.totalExpectedContribution = combineDecimalPlaces(
        ierRecord.totalExpectedContribution,
      );
      ierFileDetail.dependantChildQuantity = ierRecord.dependantChildQuantity;
      ierFileDetail.dependantChildInDaycareQuantity =
        ierRecord.dependantChildInDaycareQuantity;
      ierFileDetail.dependantInfantQuantity = ierRecord.dependantInfantQuantity;
      ierFileDetail.dependantOtherQuantity =
        ierRecord.dependantDeclaredOnTaxesQuantity;
      ierFileDetail.dependantPostSecondaryQuantity =
        ierRecord.dependantPostSecondaryQuantity;
      ierFileDetail.totalDependantQuantity = ierRecord.totalEligibleDependents;
      ierFileDetail.familyMembersQuantity = ierRecord.familySize;
      ierFileDetail.parent1Flag = this.convertToYNFlag(
        ierRecord.numberOfParents > 0,
      );
      ierFileDetail.parent2Flag = this.convertToYNFlag(
        ierRecord.numberOfParents === 2,
      );
      ierFileDetail.partnerFlag = this.convertToYNFlag(ierRecord.hasPartner);
      ierFileDetail.parentalAssets = this.combineDecimalPlacesOptional(
        ierRecord.parentalAssets,
      );
      ierFileDetail.parentalAssetsExpectedContribution =
        this.combineDecimalPlacesOptional(ierRecord.parentalAssetContribution);
      ierFileDetail.parentalVoluntaryContribution =
        this.combineDecimalPlacesOptional(ierRecord.parentalContribution);
      ierFileDetail.parentalIncomeExpectedContribution =
        this.combineDecimalPlacesOptional(ierRecord.parentalContribution);
      ierFileDetail.parentalDiscretionaryIncome =
        this.combineDecimalPlacesOptional(ierRecord.parentDiscretionaryIncome);
      ierFileDetail.parentalDiscretionaryAnnualIncomeFormulaResult =
        this.combineDecimalPlacesOptional(
          ierRecord.parentalDiscretionaryContribution,
        );
      ierFileDetail.studentLivingAtHomeFlag = this.convertToYNFlag(
        ierRecord.studentLivingWithParents,
      );
      ierFileDetail.partnerInSchoolFlag = this.convertToYNFlag(
        ierRecord.partnerStudyWeeks > 0,
      );
      ierFileDetail.totalEducationalExpenses = combineDecimalPlaces(
        ierRecord.exceptionExpenses +
          ierRecord.tuitionFees +
          ierRecord.booksAndSuppliesCost,
      );
      ierFileDetail.dependantLivingAllowance =
        this.combineDecimalPlacesOptional(
          ierRecord.dependantTotalMSOLAllowance,
        );
      ierFileDetail.studentLivingAllowance = combineDecimalPlaces(
        ierRecord.studentMSOLAllowance,
      );
      ierFileDetail.totalLivingAllowance = combineDecimalPlaces(
        ierRecord.totalLivingAllowance,
      );
      ierFileDetail.alimonyCost = this.combineDecimalPlacesOptional(
        ierRecord.alimonyCost,
      );
      ierFileDetail.childcareCost = this.combineDecimalPlacesOptional(
        ierRecord.childcareCost,
      );
      ierFileDetail.totalNonEducationalCost = combineDecimalPlaces(
        ierRecord.totalNonEducationalCost,
      );
      ierFileDetail.totalExpenses = combineDecimalPlaces(
        ierRecord.totalAssessedCost,
      );
      ierFileDetail.assessedNeed = combineDecimalPlaces(
        ierRecord.totalAssessmentNeed,
      );
      ierFileDetail.studentEligibleAward = this.getSumOfAwards(
        ierRecord.assessmentAwards,
        {
          awardTypeExclusions: [DisbursementValueType.BCTotalGrant],
        },
      );
      ierFileDetail.coeStatus = ierRecord.coeStatus;
      ierFileDetail.disbursementScheduleStatus =
        ierRecord.disbursementScheduleStatus;
      ierFileDetail.earliestDateOfDisbursement =
        ierRecord.earliestDateOfDisbursement;
      ierFileDetail.dateOfDisbursement = ierRecord.dateOfDisbursement;
      ierFileDetail.disbursementCancelDate = ierRecord.disbursementCancelDate;
      ierFileDetail.fundingDetails = this.getFundingDetails(
        ierRecord.disbursementAwards,
      );
      ierFileDetail.documentProducedDate = ierRecord.disbursementSentDate;
      ierFileDetail.applicationEventCode = ierRecord.applicationEventCode;
      ierFileDetail.applicationEventDate = ierRecord.applicationEventDate;
      ierFileDetail.currentOfferingId = ierRecord.currentOfferingId;
      ierFileDetail.parentOfferingId = ierRecord.parentOfferingId;
      ierFileDetail.returnTransportationCosts =
        this.combineDecimalPlacesOptional(ierRecord.returnTransportationCosts);
      ierFileDetail.extraLocalTransportationCosts =
        this.combineDecimalPlacesOptional(
          ierRecord.extraLocalTransportationCosts,
        );
      ierFileDetail.extraShelterCosts = this.combineDecimalPlacesOptional(
        ierRecord.extraShelterCosts,
      );
      return ierFileDetail;
    });
    ierFileLines.push(...fileRecords);
    return ierFileLines;
  }

  /**
   * Identifies the given types of scholastic standing changes and
   * returns the effective date which is study period end date of the
   * offering which is created as a result of scholastic standing change.
   * The change types `Student did not complete program` and `Student withdrew from program`
   * are ignored.
   * @param assessmentTriggerType assessment trigger type.
   * @param scholasticStandingChangeType scholastic standing change type.
   * @param studyEndDate study end date.
   * @returns scholastic standing effective date.
   */
  private getScholasticStandingEffectiveDate(
    assessmentTriggerType: AssessmentTriggerType,
    scholasticStandingChangeType: StudentScholasticStandingChangeType,
    studyEndDate: Date,
  ): Date | null {
    if (
      assessmentTriggerType ===
        AssessmentTriggerType.ScholasticStandingChange &&
      (scholasticStandingChangeType ===
        StudentScholasticStandingChangeType.StudentCompletedProgramEarly ||
        scholasticStandingChangeType ===
          StudentScholasticStandingChangeType.SchoolTransfer)
    ) {
      return studyEndDate;
    }
    return null;
  }

  /**
   * Get scholastic standing code.
   * Scholastic standing code does not consider the
   * scholastic standing change type `Student withdrew from program`.
   * @param assessmentTriggerType assessment trigger type.
   * @param scholasticStandingChangeType scholastic standing change type.
   * @returns scholastic standing code.
   */
  private getScholasticStandingCode(
    assessmentTriggerType: AssessmentTriggerType,
    scholasticStandingChangeType: StudentScholasticStandingChangeType,
  ): ScholasticStandingCode | null {
    if (
      assessmentTriggerType !== AssessmentTriggerType.ScholasticStandingChange
    ) {
      return null;
    }
    const scholasticStandingCodeMap = {
      [StudentScholasticStandingChangeType.StudentDidNotCompleteProgram]:
        ScholasticStandingCode.UC,
      [StudentScholasticStandingChangeType.StudentCompletedProgramEarly]:
        ScholasticStandingCode.EC,
      [StudentScholasticStandingChangeType.SchoolTransfer]:
        ScholasticStandingCode.ST,
    };
    return scholasticStandingCodeMap[scholasticStandingChangeType];
  }

  /**
   * Get application status code based on application status.
   * @param applicationStatus application status.
   * @returns application status code.
   */
  private getApplicationStatusCode(
    applicationStatus: ApplicationStatus,
  ): ApplicationStatusCode {
    const applicationStatusMap = {
      [ApplicationStatus.Submitted]: ApplicationStatusCode.Submitted,
      [ApplicationStatus.InProgress]: ApplicationStatusCode.InProgress,
      [ApplicationStatus.Assessment]: ApplicationStatusCode.Assessment,
      [ApplicationStatus.Enrolment]: ApplicationStatusCode.Enrolment,
      [ApplicationStatus.Completed]: ApplicationStatusCode.Completed,
      [ApplicationStatus.Cancelled]: ApplicationStatusCode.Cancelled,
    };
    return applicationStatusMap[applicationStatus];
  }

  /**
   * Get funding type and funding amount in a key value format.
   * last 2 digits in funding amount holds the decimal value.
   * e.g. `{"CSLF":100000,"BCSL":150000}` which represents `{"CSLF":1000.00,"BCSL":1500.00}`
   * @param awards disbursement awards.
   * @returns funding details.
   */
  private getFundingDetails(awards: IERAward[]): Record<string, number> {
    const fundingDetails: Record<string, number> = {};
    awards.forEach((award) => {
      fundingDetails[award.valueCode] = combineDecimalPlaces(award.valueAmount);
    });
    return fundingDetails;
  }

  /**
   * Get the sum of all awards which belong to the disbursements in a single assessment.
   * @param awards award details.
   * @param options award summation options:
   * - `awardTypeInclusions`: awards which are included for summation.
   * - `awardTypeExclusions`: awards which are excluded for summation.
   * @returns sum of awards.
   */
  private getSumOfAwards(
    awards: IERAward[],
    options?: {
      awardTypeInclusions?: DisbursementValueType[];
      awardTypeExclusions?: DisbursementValueType[];
    },
  ): number {
    const totalAwardsAmount = awards
      .filter(
        (award) =>
          (!options?.awardTypeInclusions?.length ||
            options.awardTypeInclusions.includes(award.valueType)) &&
          (!options?.awardTypeExclusions?.length ||
            !options.awardTypeExclusions.includes(award.valueType)),
      )
      .map((disbursementValue) => disbursementValue.valueAmount)
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    return combineDecimalPlaces(totalAwardsAmount);
  }

  /**
   * Get withdrawal date for an assessment which is created due to scholastic standing change.
   * @param assessmentTriggerType assessment trigger type.
   * @param scholasticStandingChangeType scholastic standing change type.
   * @param studyEndDate study end date.
   * @returns withdrawal date.
   */
  private getWithdrawalDate(
    assessmentTriggerType: AssessmentTriggerType,
    scholasticStandingChangeType: StudentScholasticStandingChangeType,
    studyEndDate: Date,
  ): Date | null {
    if (
      assessmentTriggerType ===
        AssessmentTriggerType.ScholasticStandingChange &&
      scholasticStandingChangeType ===
        StudentScholasticStandingChangeType.StudentWithdrewFromProgram
    ) {
      return studyEndDate;
    }
    return null;
  }

  /**
   * Convert boolean value to YNFlag type.
   * @param value value to be converted.
   * @returns flag value.
   */
  private convertToYNFlag(value: boolean): YNFlag {
    return value ? YNFlag.Y : YNFlag.N;
  }

  /**
   * Get level of study code from credential type.
   * @param credentialType credential type.
   * @returns level of study code.
   */
  private getLevelOfStudyCode(credentialType: string): string {
    const levelOfStudyCodeMap: Record<string, number> = {
      qualifyingStudies: 1,
      undergraduateDegree: 3,
      graduateCertificate: 5,
      graduateDiploma: 5,
      graduateDegreeOrMasters: 5,
      postGraduateOrDoctorate: 6,
      undergraduateDiploma: 7,
      undergraduateCitation: 8,
      undergraduateCertificate: 8,
    };
    const levelOfStudyCode = levelOfStudyCodeMap[credentialType];
    return levelOfStudyCode.toString();
  }

  /**
   * Combine decimal places for optional number.
   * @param decimalNumber number to be combined.
   * @returns combined number.
   */
  private combineDecimalPlacesOptional(decimalNumber?: number): number {
    return decimalNumber ? combineDecimalPlaces(decimalNumber) : 0;
  }
}
