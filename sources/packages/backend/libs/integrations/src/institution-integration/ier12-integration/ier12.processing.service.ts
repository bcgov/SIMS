import { Injectable } from "@nestjs/common";
import {
  StudentAssessment,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { decimalRound, getFileNameAsCurrentTimestamp } from "@sims/utilities";
import { IER12IntegrationService } from "./ier12.integration.service";
import {
  ApplicationStatusCode,
  IER12Record,
  IER12UploadResult,
  IERAddressInfo,
  YNFlag,
} from "./models/ier12-integration.model";
import { StudentAssessmentService } from "@sims/integrations/services";

@Injectable()
export class IER12ProcessingService {
  institutionIntegrationConfig: InstitutionIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly ier12IntegrationService: IER12IntegrationService,
    private readonly studentAssessmentService: StudentAssessmentService,
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
    pendingAssessments.forEach((pendingAssessment) => {
      const institutionCode =
        pendingAssessment.offering.institutionLocation.institutionCode;
      if (!fileRecords[institutionCode]) {
        fileRecords[institutionCode] = [];
      }
      const ier12Records = this.createIER12Record(pendingAssessment);
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
  private createIER12Record(
    pendingAssessment: StudentAssessment,
  ): IER12Record[] {
    const application = pendingAssessment.application;
    const student = application.student;
    const user = student.user;
    const sinValidation = student.sinValidation;
    const offering = pendingAssessment.offering;
    const educationProgram = offering.educationProgram;
    const address = student.contactInfo.address;
    const applicationProgramYear = application.programYear;
    const [scholasticStanding] = application.studentScholasticStandings;
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
    return disbursementSchedules.map<IER12Record>((disbursement) => ({
      assessmentId: pendingAssessment.id,
      disbursementId: disbursement.id,
      applicationNumber: application.applicationNumber,
      institutionStudentNumber: application.data.studentNumber,
      sin: sinValidation.sin,
      studentLastName: user.lastName,
      studentGivenName: user.firstName,
      birthDate: new Date(student.birthDate),
      studentGroupCode: "A", // TODO: Dheepak
      addressInfo,
      programName: educationProgram.name,
      programDescription: educationProgram.description,
      credentialType: educationProgram.credentialType,
      fieldOfStudyCode: educationProgram.fieldOfStudyCode,
      currentProgramYear: offering.yearOfStudy,
      cipCode: educationProgram.cipCode.replace(".", ""),
      nocCode: educationProgram.nocCode,
      sabcCode: educationProgram.sabcCode,
      institutionProgramCode: educationProgram.institutionProgramCode,
      programLength: +educationProgram.completionYears, // TODO: Dheepak reference the util.
      studyStartDate: new Date(offering.studyStartDate),
      studyEndDate: new Date(offering.studyEndDate),
      tuitionFees: this.convertToAmount(offering.actualTuitionCosts),
      booksAndSuppliesCost: this.convertToAmount(offering.programRelatedCosts),
      mandatoryFees: this.convertToAmount(offering.mandatoryFees),
      exceptionExpenses: this.convertToAmount(offering.exceptionalExpenses),
      totalFundedWeeks: pendingAssessment.assessmentData.weeks,
      courseLoad: 100, // Hard coded as IER12 currently includes full time applications only.
      offeringIntensityIndicator: "F", // Hard coded as IER12 currently includes full time applications only.
      applicationSubmittedDate: application.submittedDate,
      programYear: applicationProgramYear.programYear.replace("-", ""),
      applicationStatusCode: ApplicationStatusCode.Completed, // TODO: Dheepak reference the util.
      applicationStatusDate: application.applicationStatusUpdatedOn,
      cslAmount: 100, // TODO: Dheepak reference the util.
      bcslAmount: 100, // TODO: Dheepak reference the util.
      epAmount: 100, // TODO: Dheepak reference the util.
      provincialDefaultFlag: YNFlag.N, // TODO: Dheepak reference the util.
      provincialOverawardFlag: YNFlag.N, // TODO: Dheepak reference the util.
      federalOverawardFlag: YNFlag.N, // TODO: Dheepak reference the util.
      restrictionFlag: YNFlag.N, // TODO: Dheepak reference the util.
      scholasticStandingEffectiveDate: scholasticStanding
        ? this.getScholasticStandingEffectiveDate(
            scholasticStanding.changeType,
            new Date(offering.studyEndDate),
          )
        : null,
      assessmentDate: pendingAssessment.assessmentDate,
      withdrawalDate:
        scholasticStanding?.changeType ===
        StudentScholasticStandingChangeType.StudentWithdrewFromProgram
          ? new Date(offering.studyEndDate)
          : null,
      partnerFlag: YNFlag.N, // TODO: Dheepak reference the util.
      parentalAssets: this.convertToAmount(100), // TODO: Dheepak reference the util.
      coeStatus: disbursement.coeStatus,
      disbursementScheduleStatus: disbursement.disbursementScheduleStatus,
      earliestDateOfDisbursement: new Date(disbursement.disbursementDate),
      dateOfDisbursement: new Date(),
      disbursementCancelDate: disbursement.updatedAt,
      fundingDetails: {},
    }));
  }

  /**
   * Convert a number to amount by first rounding the given number
   * to 2 decimal values and converting to format with first 8 characters holding
   * the whole number with leading 0 and last 2 characters holding the digits which comes after decimal point.
   *
   * e.g. 100.67 to 0000010067
   * 100 to 0000010000
   * @param amount amount to be converted.
   */
  private convertToAmount(amount: number): string {
    const roundedValue = decimalRound(amount).toFixed(2);
    const [numberValue, decimalValue] = roundedValue.split(".");
    const numberWithFiller = numberValue.padStart(8, "0");
    return `${numberWithFiller}${decimalValue}`;
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

  @InjectLogger()
  logger: LoggerService;
}
