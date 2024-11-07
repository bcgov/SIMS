import { Injectable } from "@nestjs/common";
import { SIMSToSFASService } from "../services/sfas";
import {
  SIMS_TO_SFAS_FILE_NAME_TIMESTAMP_FORMAT,
  SIMSToSFASProcessingResult,
  SIMSToSFASStudents,
} from "./sfas-integration.models";
import { ConfigService } from "@sims/utilities/config";
import { ProcessSummary } from "@sims/utilities/logger";
import { formatDate } from "@sims/utilities";
import { SIMSToSFASIntegrationService } from ".";

@Injectable()
export class SIMSToSFASProcessingService {
  private readonly ftpSendFolder: string;
  constructor(
    config: ConfigService,
    private readonly simsToSFASService: SIMSToSFASService,
    private readonly simsToSFASIntegrationService: SIMSToSFASIntegrationService,
  ) {
    this.ftpSendFolder = config.sfasIntegration.ftpSendFolder;
  }

  /**
   * Process all the student, application and restriction related data updates in SIMS
   * between the given period and send the bridge data to SFAS.
   * @param processSummary process summary.
   * @param modifiedSince the date after which the student data was updated.
   * @param modifiedUntil the date until which the student data was updated.
   * This is the date when the bridge file processing started.
   * @returns processing result.
   */
  async processSIMSUpdates(
    processSummary: ProcessSummary,
    modifiedSince: Date,
    modifiedUntil: Date,
  ): Promise<SIMSToSFASProcessingResult> {
    processSummary.info("Retrieving SIMS to SFAS updates.");
    // Collection of student ids with updates in student, application and restriction related data.
    // Once all the student ids are appended, only unique student ids will be returned.
    const simsToSFASStudents = new SIMSToSFASStudents();
    processSummary.info("Get all the students with updates.");
    let studentIds: number[] = [];
    // Get all the students with updates in student related data.
    // TODO: SIMS to SFAS - Get all the students with updates in application and restriction related data.
    studentIds = await this.simsToSFASService.getAllStudentsWithUpdates(
      modifiedSince,
      modifiedUntil,
    );

    const applicationRecordsPromise =
      this.simsToSFASService.getAllStudentsWithApplicationUpdates(
        modifiedSince,
        modifiedUntil,
      );

    const restrictionRecordsPromise =
      this.simsToSFASService.getAllStudentsWithRestrictionUpdates(
        modifiedSince,
        modifiedUntil,
      );

    const [applicationRecords, restrictionRecords] = await Promise.all([
      applicationRecordsPromise,
      restrictionRecordsPromise,
    ]);

    studentIds.push(
      ...applicationRecords.map((application) => application.studentId),
    );
    studentIds.push(
      ...restrictionRecords.map((restriction) => restriction.studentId),
    );

    // Append the students with student and student related data updates.
    // TODO: SIMS to SFAS - Append the student ids of students with updates in application and restriction related data.
    // When application and restriction updates are retrieved, the respective
    // student ids of applications and restrictions should be appended.
    const uniqueStudentIds = simsToSFASStudents
      .append(studentIds)
      .getUniqueStudentIds();

    // When there is no updates to process, log the summary and return.
    if (!uniqueStudentIds.length) {
      processSummary.info("There is no SIMS to SFAS updates to process.");
      return {
        studentRecordsSent: 0,
        uploadedFileName: "none",
      };
    }

    processSummary.info(
      `Found ${uniqueStudentIds.length} student(s) with updates.`,
    );
    const studentDetails =
      await this.simsToSFASService.getStudentRecordsByStudentIds(
        uniqueStudentIds,
      );

    processSummary.info(
      `Bridge file data has been extracted since ${modifiedSince} until ${modifiedUntil}.`,
    );
    // Create SIMS to SFAS file content.
    const fileLines =
      this.simsToSFASIntegrationService.createSIMSToSFASFileContent(
        modifiedUntil,
        studentDetails,
        applicationRecords,
        restrictionRecords,
      );

    const { fileName, remoteFilePath } =
      this.createSIMSToSFASFileName(modifiedUntil);

    try {
      processSummary.info(
        `Beginning to upload the SIMS to SFAS file ${remoteFilePath} to SFTP.`,
      );
      await this.simsToSFASIntegrationService.uploadContent(
        fileLines,
        remoteFilePath,
      );
    } catch (error: unknown) {
      // Translate to friendly error message.
      const errorDescription = `Unexpected error uploading the SIMS to SFAS file ${remoteFilePath} to SFTP.`;
      processSummary.error(errorDescription, error);
      throw new Error(errorDescription, { cause: error });
    }
    processSummary.info(
      `SIMS to SFAS file ${fileName} has been uploaded successfully.`,
    );
    // Create bridge file log to track the extraction date of the bridge file.
    await this.simsToSFASService.logBridgeFileDetails(modifiedUntil, fileName);
    processSummary.info(
      `SIMS to SFAS file log has been created with file name ${fileName} and reference date ${modifiedUntil}.`,
    );
    return {
      studentRecordsSent: uniqueStudentIds.length,
      uploadedFileName: fileName,
    };
  }

  /**
   * Create SIMS to SFAS file name in expected format.
   * @param bridgeDataExtractedDate bridge data extracted date.
   * @returns SIMS to SFAS file name and remote file path.
   */
  private createSIMSToSFASFileName(bridgeDataExtractedDate: Date): {
    fileName: string;
    remoteFilePath: string;
  } {
    const fileNameTimestamp = formatDate(
      bridgeDataExtractedDate,
      SIMS_TO_SFAS_FILE_NAME_TIMESTAMP_FORMAT,
    );
    const fileName = `SIMS-TO-SFAS-${fileNameTimestamp}.TXT`;
    const remoteFilePath = `${this.ftpSendFolder}\\${fileName}`;
    return { fileName, remoteFilePath };
  }
}
