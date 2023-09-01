import { Injectable } from "@nestjs/common";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { IER12FileDetail } from "./ier12-file-detail";
import {
  ApplicationStatusCode,
  IER12FileLine,
  IER12Record,
  IERAward,
  YNFlag,
} from "./models/ier12-integration.model";
import {
  ApplicationStatus,
  DisbursementValueType,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import { combineDecimalPlaces, getTotalYearsOfStudy } from "@sims/utilities";

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
      ierFileDetail.institutionStudentNumber =
        ierRecord.institutionStudentNumber;
      ierFileDetail.sin = ierRecord.sin;
      ierFileDetail.studentLastName = ierRecord.studentLastName;
      ierFileDetail.studentGivenName = ierRecord.studentGivenName;
      ierFileDetail.studentBirthDate = ierRecord.studentBirthDate;
      ierFileDetail.studentGroupCode =
        ierRecord.dependantStatus === "dependant" ? "A" : "B";
      ierFileDetail.programName = ierRecord.programName;
      ierFileDetail.programDescription = ierRecord.programDescription;
      ierFileDetail.credentialType = ierRecord.credentialType;
      ierFileDetail.fieldOfStudyCode = ierRecord.fieldOfStudyCode;
      ierFileDetail.currentProgramYear = ierRecord.currentProgramYear;
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

      ierFileDetail.programYear = ierRecord.programYear.replace("-", "");
      ierFileDetail.applicationStatusCode = this.getApplicationStatusCode(
        ierRecord.applicationStatus,
      );
      ierFileDetail.applicationStatusDate = ierRecord.applicationStatusDate;
      ierFileDetail.cslAmount = this.getSumOfAwards(
        ierRecord.assessmentAwards,
        { awardTypeInclusions: [DisbursementValueType.CanadaLoan] },
      );
      ierFileDetail.bcslAmount = this.getSumOfAwards(
        ierRecord.assessmentAwards,
        { awardTypeInclusions: [DisbursementValueType.BCLoan] },
      );
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
        ierRecord.scholasticStandingChangeType
          ? this.getScholasticStandingEffectiveDate(
              ierRecord.scholasticStandingChangeType,
              ierRecord.studyEndDate,
            )
          : null;
      ierFileDetail.assessmentDate = ierRecord.assessmentDate;
      ierFileDetail.withdrawalDate =
        ierRecord.scholasticStandingChangeType ===
        StudentScholasticStandingChangeType.StudentWithdrewFromProgram
          ? ierRecord.studyEndDate
          : null;
      ierFileDetail.partnerFlag = this.convertToYNFlag(ierRecord.hasPartner);
      ierFileDetail.parentalAssets = ierRecord.parentalAssets
        ? combineDecimalPlaces(ierRecord.parentalAssets)
        : 0;
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
   * @param scholasticStandingChangeType scholastic standing change type.
   * @param studyEndDate study end date.
   * @returns scholastic standing effective date.
   */
  private getScholasticStandingEffectiveDate(
    scholasticStandingChangeType: StudentScholasticStandingChangeType,
    studyEndDate: Date,
  ): Date | null {
    if (
      scholasticStandingChangeType ===
        StudentScholasticStandingChangeType.StudentCompletedProgramEarly ||
      scholasticStandingChangeType ===
        StudentScholasticStandingChangeType.ChangeInIntensity
    ) {
      return studyEndDate;
    }
    return null;
  }

  /**
   * Get application status code based on application status.
   * @param applicationStatus application status.
   * @returns application status code.
   */
  private getApplicationStatusCode(
    applicationStatus: ApplicationStatus,
  ): ApplicationStatusCode {
    switch (applicationStatus) {
      case ApplicationStatus.Submitted:
        return ApplicationStatusCode.Submitted;
      case ApplicationStatus.InProgress:
        return ApplicationStatusCode.InProgress;
      case ApplicationStatus.Assessment:
        return ApplicationStatusCode.Assessment;
      case ApplicationStatus.Enrolment:
        return ApplicationStatusCode.Enrolment;
      case ApplicationStatus.Completed:
        return ApplicationStatusCode.Completed;
      case ApplicationStatus.Cancelled:
        return ApplicationStatusCode.Cancelled;
    }
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
   * @param disbursements disbursements of a given assessment.
   * @param awardType award type.
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
      .reduce((accumulator, currentValue) => accumulator + currentValue);

    return totalAwardsAmount;
  }

  /**
   * Convert boolean value to YNFlag type.
   * @param value value.
   * @returns YNFlag value.
   */
  private convertToYNFlag(value: boolean) {
    return value ? YNFlag.Y : YNFlag.N;
  }
}
