import { Injectable } from "@nestjs/common";
import { DisbursementSchedule } from "@sims/sims-db";
import {
  LoggerService,
  InjectLogger,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { getFileNameAsExtendedCurrentTimestamp } from "@sims/utilities";
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
   * @param processSummary process summary for logging.
   * @returns Processing ECE request result.
   */
  async processECEFile(
    processSummary: ProcessSummary,
  ): Promise<ECEUploadResult[]> {
    processSummary.info(`Retrieving eligible COEs for ECE request.`);
    const eligibleCOEs =
      await this.disbursementScheduleService.getInstitutionEligiblePendingEnrolments();
    if (!eligibleCOEs.length) {
      return [];
    }
    processSummary.info(`Found ${eligibleCOEs.length} COEs.`);
    const fileRecords: Record<string, ECERecord[]> = {};
    eligibleCOEs.forEach((eligibleCOE) => {
      const offering = eligibleCOE.studentAssessment.offering;
      const institutionCode = offering.institutionLocation.institutionCode;
      if (!fileRecords[institutionCode]) {
        fileRecords[institutionCode] = [];
      }
      fileRecords[institutionCode].push(this.createECERecord(eligibleCOE));
    });
    const uploadResult: ECEUploadResult[] = [];
    try {
      processSummary.info("Creating ECE request content.");
      for (const institutionCode of Object.keys(fileRecords)) {
        const uploadProcessSummary = new ProcessSummary();
        processSummary.children(uploadProcessSummary);
        const eceUploadResult = await this.uploadECEContent(
          institutionCode,
          fileRecords[institutionCode],
          uploadProcessSummary,
        );
        uploadResult.push(eceUploadResult);
      }
    } catch (error: unknown) {
      const logMessage = "Error while uploading content for ECE request.";
      this.logger.error(logMessage, error);
      processSummary.error(logMessage, error);
      throw error;
    }
    return uploadResult;
  }

  /**
   * Upload the content in SFTP server location.
   * @param institutionCode Institution code for the file generated.
   * @param institutionFileRecords Total records with institutionCode.
   * @param processSummary process summary for logging.
   * @returns Updated records count with filepath.
   */
  async uploadECEContent(
    institutionCode: string,
    institutionFileRecords: ECERecord[],
    processSummary: ProcessSummary,
  ): Promise<ECEUploadResult> {
    processSummary.info(
      `Processing content for institution code ${institutionCode}.`,
    );
    try {
      // Create the Request content for the ECE request file by populating the content.
      const fileContent = this.eceIntegrationService.createECEFileContent(
        institutionFileRecords,
      );
      // Create the request filename with the file path for the each and every institutionCode.
      const fileInfo = this.createRequestFileName(institutionCode);
      processSummary.info("Uploading content.");
      await this.eceIntegrationService.uploadContent(
        fileContent,
        fileInfo.filePath,
      );
      processSummary.info("Content uploaded.");
      const eceFileFooter = fileContent[
        fileContent.length - 1
      ] as ECEFileFooter;
      processSummary.info(
        `Uploaded file ${fileInfo.filePath}, with ${eceFileFooter.recordCount} record(s).`,
      );
      return {
        generatedFile: fileInfo.filePath,
        uploadedRecords: eceFileFooter.recordCount,
      };
    } catch (error: unknown) {
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
    const timestamp = getFileNameAsExtendedCurrentTimestamp();
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
    const offering = studentAssessment.offering;
    const application = studentAssessment.application;
    const student = application.student;
    const user = student.user;
    const sinValidation = student.sinValidation;
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
      studentDisabilityStatus: student.disabilityStatus,
      applicationStudentDisabilityStatus:
        studentAssessment.workflowData.calculatedData.pdppdStatus,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
