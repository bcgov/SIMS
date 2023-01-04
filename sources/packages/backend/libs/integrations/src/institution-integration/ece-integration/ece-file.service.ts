import { Injectable } from "@nestjs/common";
import { StudentAssessment } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { getFileNameAsCurrentTimestamp } from "@sims/utilities";
import { StudentAssessmentService } from "@sims/integrations/services";
import { ECERecord, ECEUploadResult } from "./models/ece-integration.model";
import { ECEIntegrationService } from "./ece-integration.service";

@Injectable()
export class ECEFileService {
  institutionIntegrationConfig: InstitutionIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly eceIntegrationService: ECEIntegrationService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    this.institutionIntegrationConfig = config.institutionIntegration;
  }

  /**
   * 1. Fetches the applications that have an eligible COE request waiting.
   * 2. Create the Request content for the ECE request file by populating the
   * header, footer and trailer content.
   * 3. Create the request filename with the file path with respect to the institution code
   * for the ECE request sent File.
   * 4. Upload the content to the zoneB SFTP server.
   * @param generatedDate date in which the assessment for
   * particular institution is generated.
   * @returns Processing ECE request result.
   */
  async processECEFile(generatedDate?: string): Promise<ECEUploadResult[]> {
    this.logger.log(`Retrieving pending assessment for ECE request...`);
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
    const fileRecords: Record<string, ECERecord[]> = {};
    pendingAssessments.forEach((pendingAssessment) => {
      const institutionCode =
        pendingAssessment.offering.institutionLocation.institutionCode;
      if (!fileRecords[institutionCode]) {
        fileRecords[institutionCode] = [];
      }
      fileRecords[institutionCode].push(
        this.createECERecord(pendingAssessment),
      );
    });
    const uploadResult: ECEUploadResult[] = [];
    try {
      this.logger.log("Creating ECE request content...");
      for (const institutionCode of Object.keys(fileRecords)) {
        const eceUploadResult = await this.uploadECEContent(
          institutionCode,
          fileRecords,
        );
        uploadResult.push(eceUploadResult);
      }
    } catch (error) {
      this.logger.error(
        `Error while uploading content for ECE request: ${error}`,
      );
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
  async uploadECEContent(
    institutionCode: string,
    fileRecords: Record<string, ECERecord[]>,
  ): Promise<ECEUploadResult> {
    try {
      // Create the Request content for the ECE request file by populating the content.
      const fileContent = this.eceIntegrationService.createECEFileContent(
        fileRecords[institutionCode],
      );
      // Create the request filename with the file path for the each and every institutionCode.
      const fileInfo = this.createRequestFileName(institutionCode);
      this.logger.log("Uploading content...");
      await this.eceIntegrationService.uploadContent(
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
        `Error while uploading content for ECE request file: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Create file name ECE request records file.
   * @param institutionCode institutionCode to be a part of the filename.
   * @returns Full file path of the file to be saved on the SFTP.
   */
  createRequestFileName(institutionCode: string): {
    fileName: string;
    filePath: string;
  } {
    const timestamp = getFileNameAsCurrentTimestamp();
    const fileName = `ECE_${timestamp}.txt`;
    const filePath = `${this.institutionIntegrationConfig.ftpRequestFolder}\\${institutionCode}\\${fileName}`;
    return {
      fileName,
      filePath,
    };
  }

  /**
   * Create the Request content for the ECE request file by populating the content.
   * @param pendingAssessment pending assessment of institutions.
   * @returns ECE request record.
   */
  private createECERecord(pendingAssessment: StudentAssessment): ECERecord {
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
