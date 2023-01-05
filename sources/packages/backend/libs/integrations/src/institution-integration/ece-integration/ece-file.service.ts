import { Injectable } from "@nestjs/common";
import { DisbursementSchedule } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { getFileNameAsCurrentTimestamp } from "@sims/utilities";
import { DisbursementScheduleService } from "@sims/integrations/services";
import { ECERecord, ECEUploadResult } from "./models/ece-integration.model";
import { ECEIntegrationService } from "./ece-integration.service";

@Injectable()
export class ECEFileService {
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
   * @param generatedDate date in which the eligible coe for
   * particular institution is required.
   * @returns Processing ECE request result.
   */
  async processECEFile(generatedDate?: string): Promise<ECEUploadResult[]> {
    this.logger.log(`Retrieving eligible COEs for ECE request...`);
    const eligibleCOEs = await this.disbursementScheduleService.getEligibleCOE(
      generatedDate,
    );
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
        eligibleCOE.studentAssessment.offering.institutionLocation
          .institutionCode;
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
   * @param eligibleCOE eligible COE of institutions.
   * @returns ECE request record.
   */
  private createECERecord(eligibleCOE: DisbursementSchedule): ECERecord {
    const studentAssessment = eligibleCOE.studentAssessment;
    const application = studentAssessment.application;
    const student = application.student;
    const user = student.user;
    const sinValidation = student.sinValidation;
    const offering = studentAssessment.offering;
    const institutionLocation = offering.institutionLocation;
    return {
      institutionCode: institutionLocation.institutionCode,
      awardDisbursmentIdx: null,
      disbursementValues: eligibleCOE.disbursementValues,
      sin: sinValidation.sin,
      studentLastName: user.lastName,
      studentGivenName: user.firstName,
      birthDate: student.birthDate,
      sfasApplicationNumber: application.applicationNumber,
      institutionStudentNumber: application.studentNumber,
      courseLoad: offering.courseLoad?.toString(),
      studyStartDate: offering.studyStartDate,
      studyEndDate: offering.studyEndDate,
      disbursementDate: eligibleCOE.disbursementDate,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
