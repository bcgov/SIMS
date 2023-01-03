import { Injectable } from "@nestjs/common";
import { StudentAssessment } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { getFileNameAsCurrentTimestamp } from "@sims/utilities";
import { IER12IntegrationService } from "./ier12-integration.service";
import {
  IER12Record,
  IER12UploadResult,
} from "./models/ier12-integration.model";
import { StudentAssessmentService } from "@sims/integrations/services";

@Injectable()
export class IER12FileService {
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
      fileRecords[institutionCode].push(
        this.createIER12Record(pendingAssessment),
      );
    });
    const uploadResult: IER12UploadResult[] = [];
    try {
      this.logger.log("Creating IER 12 content...");
      for (const institutionCode of Object.keys(fileRecords)) {
        const ierUploadResult = await this.uploadIER12Content(
          institutionCode,
          fileRecords,
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
    fileRecords: Record<string, IER12Record[]>,
  ): Promise<IER12UploadResult> {
    try {
      // Create the Request content for the IER 12 file by populating the content.
      const fileContent = this.ier12IntegrationService.createIER12FileContent(
        fileRecords[institutionCode],
      );
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
  private createIER12Record(pendingAssessment: StudentAssessment): IER12Record {
    const application = pendingAssessment.application;
    const student = application.student;
    const user = student.user;
    const sinValidation = student.sinValidation;
    const offering = pendingAssessment.offering;
    const educationProgram = offering.educationProgram;
    return {
      assessmentId: pendingAssessment.id,
      applicationNumber: application.applicationNumber,
      sin: sinValidation.sin,
      studentLastName: user.lastName,
      studentGivenName: user.firstName,
      birthDate: student.birthDate,
      programName: educationProgram.name,
      programDescription: educationProgram.description,
      credentialType: educationProgram.credentialType,
      cipCode: parseFloat(educationProgram.cipCode) * 10000,
      nocCode: educationProgram.nocCode,
      sabcCode: educationProgram.sabcCode,
      institutionProgramCode: educationProgram.institutionProgramCode,
      programLength: offering.yearOfStudy,
      studyStartDate: offering.studyStartDate,
      studyEndDate: offering.studyEndDate,
      tuitionFees: offering.actualTuitionCosts,
      programRelatedCosts: offering.programRelatedCosts,
      mandatoryFees: offering.mandatoryFees,
      exceptionExpenses: offering.exceptionalExpenses,
      totalFundedWeeks: offering.studyBreaks.totalFundedWeeks,
      disbursementSchedules: pendingAssessment.disbursementSchedules,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
