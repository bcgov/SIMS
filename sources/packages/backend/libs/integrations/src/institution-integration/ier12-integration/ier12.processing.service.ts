import { Injectable } from "@nestjs/common";
import {
  ApplicationStatus,
  DisbursementValue,
  DisbursementValueType,
  StudentAssessment,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import {
  combineDecimalPlaces,
  getFileNameAsCurrentTimestamp,
  getTotalYearsOfStudy,
} from "@sims/utilities";
import { IER12IntegrationService } from "./ier12.integration.service";
import {
  ApplicationStatusCode,
  IER12Record,
  IER12UploadResult,
  IERAddressInfo,
  YNFlag,
} from "./models/ier12-integration.model";
import {
  DisbursementReceiptService,
  StudentAssessmentService,
} from "@sims/integrations/services";

@Injectable()
export class IER12ProcessingService {
  institutionIntegrationConfig: InstitutionIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly ier12IntegrationService: IER12IntegrationService,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly disbursementReceiptService: DisbursementReceiptService,
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
    pendingAssessments.forEach(async (pendingAssessment) => {
      const institutionCode =
        pendingAssessment.offering.institutionLocation.institutionCode;
      if (!fileRecords[institutionCode]) {
        fileRecords[institutionCode] = [];
      }
      const ier12Records = await this.createIER12Record(pendingAssessment);
      fileRecords[institutionCode].push(...ier12Records);
    });
    const uploadResult: IER12UploadResult[] = [];
    try {
      this.logger.log("Creating IER 12 content...");
      for (const [institutionCode, ier12Records] of Object.entries(
        fileRecords,
      )) {
        const ierUploadResult = await this.uploadIER12Content(
          institutionCode,
          ier12Records,
        );
        uploadResult.push(ierUploadResult);
      }
    } catch (error) {
      this.logger.error(`Error while uploading content for IER 12: ${error}`);
      throw error;
    }
    return uploadResult;
  }

  /**
   * Upload the content in SFTP server location.
   * @param institutionCode Institution code for the file generated.
   * @param fileRecords Total records with institutionCode.
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
   * @returns IER 12 record.
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
    const cslAmount = this.getSumOfAssessmentAwards(pendingAssessment, {
      awardTypeInclusions: [DisbursementValueType.CanadaLoan],
    });
    const bcslAmount = this.getSumOfAssessmentAwards(pendingAssessment, {
      awardTypeInclusions: [DisbursementValueType.BCLoan],
    });
    const epAmount = this.getSumOfAssessmentAwards(pendingAssessment, {
      awardTypeExclusions: [
        DisbursementValueType.CanadaLoan,
        DisbursementValueType.BCLoan,
        DisbursementValueType.BCTotalGrant,
      ],
    });
    const studentGroupCode =
      pendingAssessment.workflowData.studentData.dependantStatus === "dependant"
        ? "A"
        : "B";
    const cipCode = educationProgram.cipCode.replace(".", "");
    const programLength = getTotalYearsOfStudy(
      educationProgram.completionYears,
    );
    const tuitionFees = combineDecimalPlaces(offering.actualTuitionCosts);
    const booksAndSuppliesCost = combineDecimalPlaces(
      offering.programRelatedCosts,
    );
    const mandatoryFees = combineDecimalPlaces(offering.mandatoryFees);
    const exceptionExpenses = combineDecimalPlaces(
      offering.exceptionalExpenses,
    );
    const programYear = applicationProgramYear.programYear.replace("-", "");
    const applicationStatusCode = this.getApplicationStatusCode(
      application.applicationStatus,
    );
    const scholasticStandingEffectiveDate = scholasticStanding
      ? this.getScholasticStandingEffectiveDate(
          scholasticStanding.changeType,
          new Date(offering.studyEndDate),
        )
      : null;
    const withdrawalDate =
      scholasticStanding?.changeType ===
      StudentScholasticStandingChangeType.StudentWithdrewFromProgram
        ? new Date(offering.studyEndDate)
        : null;
    const parentalAssets = combineDecimalPlaces(
      pendingAssessment.workflowData.calculatedData.parentalAssets ?? 0,
    );
    // TODO: Mapping has been done based on the first analysis of IER12.
    // Mapping needs to be updated when the complete analysis is done.
    const disbursementSchedules = pendingAssessment.disbursementSchedules;
    const addressInfo: IERAddressInfo = {
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      provinceState: address.provinceState,
      postalCode: address.postalCode,
    };
    const ier12Records: IER12Record[] = [];
    for (const disbursement of disbursementSchedules) {
      const disbursementReceipt =
        await this.disbursementReceiptService.getDisbursementReceiptByDisbursementSchedule(
          disbursement.id,
        );
      const ier12Record: IER12Record = {
        assessmentId: pendingAssessment.id,
        disbursementId: disbursement.id,
        applicationNumber: application.applicationNumber,
        institutionStudentNumber: application.data.studentNumber,
        sin: sinValidation.sin,
        studentLastName: user.lastName,
        studentGivenName: user.firstName,
        birthDate: new Date(student.birthDate),
        studentGroupCode,
        addressInfo,
        programName: educationProgram.name,
        programDescription: educationProgram.description,
        credentialType: educationProgram.credentialType,
        fieldOfStudyCode: educationProgram.fieldOfStudyCode,
        currentProgramYear: offering.yearOfStudy,
        cipCode,
        nocCode: educationProgram.nocCode,
        sabcCode: educationProgram.sabcCode,
        institutionProgramCode: educationProgram.institutionProgramCode,
        programLength,
        studyStartDate: new Date(offering.studyStartDate),
        studyEndDate: new Date(offering.studyEndDate),
        tuitionFees,
        booksAndSuppliesCost,
        mandatoryFees,
        exceptionExpenses,
        totalFundedWeeks: pendingAssessment.assessmentData.weeks,
        courseLoad: 100, // Hard coded as IER12 currently includes full time applications only.
        offeringIntensityIndicator: "F", // Hard coded as IER12 currently includes full time applications only.
        applicationSubmittedDate: application.submittedDate,
        programYear,
        applicationStatusCode,
        applicationStatusDate: application.applicationStatusUpdatedOn,
        cslAmount,
        bcslAmount,
        epAmount,
        provincialDefaultFlag: YNFlag.N, // TODO: Dheepak reference the util.
        provincialOverawardFlag: YNFlag.N, // TODO: Dheepak reference the util.
        federalOverawardFlag: YNFlag.N, // TODO: Dheepak reference the util.
        restrictionFlag: YNFlag.N, // TODO: Dheepak reference the util.
        scholasticStandingEffectiveDate,
        assessmentDate: pendingAssessment.assessmentDate,
        withdrawalDate,
        partnerFlag: YNFlag.N, // TODO: Dheepak reference the util.
        parentalAssets,
        coeStatus: disbursement.coeStatus,
        disbursementScheduleStatus: disbursement.disbursementScheduleStatus,
        earliestDateOfDisbursement: new Date(disbursement.disbursementDate),
        dateOfDisbursement: disbursementReceipt.disburseDate
          ? new Date(disbursementReceipt.disburseDate)
          : null,
        disbursementCancelDate: disbursement.updatedAt,
        fundingDetails: this.getFundingDetails(disbursement.disbursementValues),
      };
      ier12Records.push(ier12Record);
    }
    return ier12Records;
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
   * @param disbursementValues disbursement values.
   * @returns funding details.
   */
  private getFundingDetails(
    disbursementValues: DisbursementValue[],
  ): Record<string, number> {
    const fundingDetails: Record<string, number> = {};
    disbursementValues.forEach((disbursementValue) => {
      fundingDetails[disbursementValue.valueCode] = combineDecimalPlaces(
        disbursementValue.valueAmount,
      );
    });
    return fundingDetails;
  }

  /**
   * Get the sum of all awards which belong to the disbursements in a single assessment.
   * @param disbursements disbursements of a given assessment.
   * @param awardType award type.
   * @returns sum of awards.
   */
  private getSumOfAssessmentAwards(
    assessment: StudentAssessment,
    options?: {
      awardTypeInclusions?: DisbursementValueType[];
      awardTypeExclusions?: DisbursementValueType[];
    },
  ): number {
    let totalAwardsAmount = 0;
    assessment.disbursementSchedules.forEach((disbursement) => {
      const disbursementAwardsAmount = disbursement.disbursementValues
        .filter(
          (disbursementValue) =>
            (!options?.awardTypeInclusions?.length ||
              options.awardTypeInclusions.includes(
                disbursementValue.valueType,
              )) &&
            (!options?.awardTypeExclusions?.length ||
              !options.awardTypeExclusions.includes(
                disbursementValue.valueType,
              )),
        )
        .map((disbursementValue) => disbursementValue.valueAmount)
        .reduce((accumulator, currentValue) => accumulator + currentValue);
      totalAwardsAmount += disbursementAwardsAmount;
    });
    return totalAwardsAmount;
  }

  @InjectLogger()
  logger: LoggerService;
}
