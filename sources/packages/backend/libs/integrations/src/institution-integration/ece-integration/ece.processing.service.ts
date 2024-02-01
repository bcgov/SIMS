import { Injectable } from "@nestjs/common";
import { DisbursementSchedule } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { getFileNameAsCustomizedCurrentTimestamp } from "@sims/utilities";
import { DisbursementScheduleService } from "@sims/integrations/services";
import { ECERecord, ECEUploadResult } from "./models/ece-integration.model";
import { ECEIntegrationService } from "./ece.integration.service";
import { ECEFileFooter } from "./ece-files/ece-file-footer";

@Injectable()
export class ECEProcessingService {
  institutionIntegrationConfig: InstitutionIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly eceIntegrationService: ECEIntegrationService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
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
   * @returns Processing ECE request result.
   */
  async processECEFile(): Promise<ECEUploadResult[]> {
    this.logger.log(`Retrieving eligible COEs for ECE request...`);
    const eligibleCOEs =
      await this.disbursementScheduleService.getPendingCOEs();
    if (!eligibleCOEs.length) {
      return [
        {
          generatedFile: "none",
          uploadedRecords: 0,
        },
      ];
    }
    this.logger.log(`Found ${eligibleCOEs.length} COEs.`);
    const fileRecords: Record<string, ECERecord[]> = {};
    eligibleCOEs.forEach((eligibleCOE) => {
      const institutionCode =
        eligibleCOE.studentAssessment.application.currentAssessment.offering
          .institutionLocation.institutionCode;
      if (!fileRecords[institutionCode]) {
        fileRecords[institutionCode] = [];
      }
      fileRecords[institutionCode].push(this.createECERecord(eligibleCOE));
    });
    const uploadResult: ECEUploadResult[] = [];
    try {
      this.logger.log("Creating ECE request content...");
      for (const institutionCode of Object.keys(fileRecords)) {
        const eceUploadResult = await this.uploadECEContent(
          institutionCode,
          fileRecords[institutionCode],
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
   * @param institutionFileRecords Total records with institutionCode.
   * @returns Updated records count with filepath.
   */
  async uploadECEContent(
    institutionCode: string,
    institutionFileRecords: ECERecord[],
  ): Promise<ECEUploadResult> {
    try {
      // Create the Request content for the ECE request file by populating the content.
      const fileContent = this.eceIntegrationService.createECEFileContent(
        institutionFileRecords,
      );
      // Create the request filename with the file path for the each and every institutionCode.
      const fileInfo = this.createRequestFileName(institutionCode);
      this.logger.log("Uploading content...");
      await this.eceIntegrationService.uploadContent(
        fileContent,
        fileInfo.filePath,
      );
      this.logger.log("Content uploaded.");
      const eceFileFooter = fileContent[
        fileContent.length - 1
      ] as ECEFileFooter;
      return {
        generatedFile: fileInfo.filePath,
        uploadedRecords: eceFileFooter.recordCount,
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
    const timestamp = getFileNameAsCustomizedCurrentTimestamp();
    const fileName = `ECE-${timestamp}.txt`;
    const filePath = `${this.institutionIntegrationConfig.ftpRequestFolder}\\${institutionCode}\\${fileName}`;
    return {
      fileName,
      filePath,
    };
  }

  /**
   * Create the Request content for the ECE request file by populating the content.
   * @param eligibleCOE eligible COE of institutions.
   * @returns ECE request record.
   */
  private createECERecord(eligibleCOE: DisbursementSchedule): ECERecord {
    const studentAssessment = eligibleCOE.studentAssessment;
    const application = studentAssessment.application;
    const currentAssessment = application.currentAssessment;
    const student = application.student;
    const user = student.user;
    const sinValidation = student.sinValidation;
    const offering = currentAssessment.offering;
    const institutionLocation = offering.institutionLocation;
    return {
      institutionCode: institutionLocation.institutionCode,
      disbursementValues: eligibleCOE.disbursementValues,
      sin: sinValidation.sin,
      studentLastName: user.lastName,
      studentGivenName: user.firstName,
      birthDate: student.birthDate,
      applicationNumber: application.applicationNumber,
      institutionStudentNumber: application.studentNumber,
      studyStartDate: offering.studyStartDate,
      studyEndDate: offering.studyEndDate,
      disbursementDate: eligibleCOE.disbursementDate,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
