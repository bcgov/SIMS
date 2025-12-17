import { Injectable } from "@nestjs/common";
import { ProcessSummary } from "@sims/utilities/logger";
import { T4AIntegrationService } from "@sims/integrations/t4a/t4a.integration.service";
import { getISODateOnlyString } from "@sims/utilities";
import * as Client from "ssh2-sftp-client";
import { SshService, StudentService } from "@sims/integrations/services";
import {
  NotificationActionsService,
  StudentFileSharedService,
  SystemUsersService,
} from "@sims/services";
import { FileOriginType, Student } from "@sims/sims-db";
import { FILE_HASH_DUPLICATION_ERROR } from "@sims/services/constants";
import {
  T4A_FILE_GROUP_NAME,
  T4A_FILE_PART,
} from "@sims/integrations/constants";
import { T4AUploadFileQueueInDTO } from "@sims/services/queue/dto/t4a-upload.dto";
import { T4AFileInfo } from "@sims/integrations/t4a/models/t4a.models";
import { DataSource } from "typeorm";
import { SSHErrorCodes } from "@sims/integrations/services/ssh";

/**
 * Basic regex to validate a SIN format (9 digits).
 * Please note that this regex does not validate if the SIN is actually valid,
 * just if it has the correct format.
 */
const SIN_REGEX = /^\d{9}$/;

/**
 * Service to process the upload of T4A files to student accounts.
 */
@Injectable()
export class T4AUploadProcessingService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly t4aIntegrationService: T4AIntegrationService,
    private readonly studentFileSharedService: StudentFileSharedService,
    private readonly systemUsersService: SystemUsersService,
    private readonly studentService: StudentService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Process the upload of a T4A files batch.
   * @param files Array of files to be processed.
   * @param referenceDate The reference date for processing. Received from
   * the enqueuer to ensure all files in the batches have the same reference date.
   * @param processSummary Summary object to log the process details.
   */
  async process(
    files: T4AUploadFileQueueInDTO[],
    referenceDate: Date,
    processSummary: ProcessSummary,
  ): Promise<void> {
    let sftpClient: Client;
    try {
      processSummary.info("Extracting T4A file information.");
      // Identify all SINs in the files to be processed.
      const sinNumbers: string[] = [];
      // Map of file path to T4A file info for quick access later.
      const t4aFileInfosMap: Map<string, T4AFileInfo> = new Map();
      for (const file of files) {
        const t4aFileInfo = this.t4aIntegrationService.getT4FileInfo(
          file.relativeFilePath,
        );
        // Execute a basic format validation before searching the students, since this value is received
        // through the queue payload and could be not in the expected format.
        if (SIN_REGEX.test(t4aFileInfo.sin)) {
          sinNumbers.push(t4aFileInfo.sin);
        } else {
          processSummary.warn(
            `The SIN associated with the file unique ID ${file.uniqueID} is not valid: ${t4aFileInfo.sin}.`,
          );
        }
        t4aFileInfosMap.set(file.relativeFilePath, t4aFileInfo);
      }
      // Get all students associated with the SINs in the files to be
      // processed to avoid querying the database for each file.
      const batchStudents =
        await this.studentService.getStudentsByValidSIN(sinNumbers);
      processSummary.info("Creating SFTP client and starting process.");
      sftpClient = await this.t4aIntegrationService.getClient();
      const formattedReferenceDate = getISODateOnlyString(referenceDate);
      for (const file of files) {
        const fileProcessSummary = new ProcessSummary();
        processSummary.children(fileProcessSummary);
        const t4aFileInfo = t4aFileInfosMap.get(file.relativeFilePath);
        await this.processT4AFile(
          sftpClient,
          batchStudents,
          file,
          t4aFileInfo,
          formattedReferenceDate,
          fileProcessSummary,
        );
      }
    } catch (error: unknown) {
      // Stops processing if some error occurs.
      // The method processT4AFile handles errors for each file individually
      // and decides if the processing should continue or not.
      // Errors caught here should stop the entire processing, for instance,
      // SFTP connection errors during sftpClient creation process.
      processSummary.error("Error uploading file.", error);
    } finally {
      await this.t4aIntegrationService.ensureClientClosed(
        "Upload process completed.",
        sftpClient,
      );
    }
  }

  /**
   * Process a single T4A file: download from SFTP and upload to student account.
   * @param sftpClient Shared SFTP client to be used for file download. Creating
   * a new client for each file would be inefficient.
   * @param batchStudents Students in the current batch to search the SIN.
   * @param file File to be processed.
   * @param formattedReferenceDate Reference date formatted as string for file naming.
   * @param processSummary Summary object to log the process details.
   */
  private async processT4AFile(
    sftpClient: Client,
    batchStudents: Student[],
    file: T4AUploadFileQueueInDTO,
    t4aFileInfo: T4AFileInfo,
    formattedReferenceDate: string,
    processSummary: ProcessSummary,
  ): Promise<void> {
    processSummary.info(`Processing file unique ID ${file.uniqueID}.`);
    try {
      // Find the student associate with the SIN in the file name.
      const student = await this.getAssociatedStudent(
        batchStudents,
        t4aFileInfo,
        file.uniqueID,
        processSummary,
      );
      if (!student) {
        // No student found, skip the file processing.
        await this.archiveFile(
          sftpClient,
          file.uniqueID,
          t4aFileInfo.remoteFileFullPath,
          processSummary,
        );
        return;
      }
      // Download the file from the SFTP.
      processSummary.info("Start download from the SFTP.");
      const startDownloadTime = performance.now();
      const t4aFileContent =
        await this.t4aIntegrationService.downloadResponseFile(
          t4aFileInfo.remoteFileFullPath,
          { client: sftpClient },
        );
      const endDownloadTime = performance.now();
      processSummary.info(
        `File downloaded in ${(endDownloadTime - startDownloadTime).toFixed(2)}ms.`,
      );
      // Upload the file to the student account.
      const startFileCreationTime = performance.now();
      const fileCreated = await this.createStudentFile(
        student,
        t4aFileInfo,
        formattedReferenceDate,
        file.uniqueID,
        t4aFileContent,
        processSummary,
      );
      const fileProcessLogMessage = fileCreated
        ? "created"
        : "skipped due to duplication";
      processSummary.info(
        `File ${fileProcessLogMessage}, time taken ${(performance.now() - startFileCreationTime).toFixed(2)}ms.`,
      );
      await this.archiveFile(
        sftpClient,
        file.uniqueID,
        t4aFileInfo.remoteFileFullPath,
        processSummary,
      );
    } catch (error: unknown) {
      if (SshService.hasError(error, SSHErrorCodes.NotConnected)) {
        // Stops processing as the SFTP client is disconnected.
        throw new Error("SFTP client disconnected unexpectedly.", {
          cause: error,
        });
      }
      // Register the error but continue processing other files.
      processSummary.error(
        `Error while processing file unique ID ${file.uniqueID}.`,
        error,
      );
    }
  }

  /**
   * Archive the processed T4A file on the SFTP.
   * @param sftpClient SFTP client to be used for the operation.
   * @param uniqueID Unique ID of the file to be archived, used for logging.
   * @param remoteFileFullPath Full remote file path of the T4A file.
   * @param processSummary Summary object to log the process details.
   */
  private async archiveFile(
    sftpClient: Client,
    uniqueID: string,
    remoteFileFullPath: string,
    processSummary: ProcessSummary,
  ): Promise<void> {
    processSummary.info(`Archiving file unique ID ${uniqueID}.`);
    await this.t4aIntegrationService.archiveFile(remoteFileFullPath, {
      client: sftpClient,
    });
    processSummary.info(`File unique ID ${uniqueID} archived.`);
  }

  /**
   * Get the student associated with the given T4A file information
   * producing necessary logs in the process summary.
   * @param batchStudents Students in the current batch to search the SIN.
   * @param t4aFileInfo T4A file information to get the SIN and find the student.
   * @param uniqueID Unique ID of the file being processed.
   * @param processSummary Process summary to log information and warnings.
   * @returns The associated student or false if not found or multiple found.
   */
  private async getAssociatedStudent(
    batchStudents: Student[],
    t4aFileInfo: T4AFileInfo,
    uniqueID: string,
    processSummary: ProcessSummary,
  ): Promise<Student | false> {
    const students = batchStudents.filter((student) =>
      student.sinValidations.some(
        (sinValidation) => sinValidation.sin === t4aFileInfo.sin,
      ),
    );
    if (students.length > 1) {
      const studentIds = students.map((s) => s.id).toSorted((a, b) => a - b);
      processSummary.warn(
        `The SIN associated with the file unique ID ${uniqueID} has more than one student IDS associated: ${studentIds}.`,
      );
      return false;
    }
    if (!students.length) {
      processSummary.info(
        `No student associated with the SIN for the file unique ID ${uniqueID}.`,
      );
      return false;
    }
    const [student] = students;
    processSummary.info(`Found student ID ${student.id}.`);
    return student;
  }

  /**
   * Create the student file record, upload the file content to object storage,
   * and send the notification to the student.
   * @param student Student to whom the file will be associated with enough
   * information to generate the notification.
   * @param t4aFileInfo T4A file information to generate the file names and group.
   * @param formattedReferenceDate Reference date to be included in the file name.
   * @param fileUniqueID Unique ID to be included in the file name.
   * @param t4aFileContent Content of the T4A file to be uploaded.
   * @param processSummary Process summary to log the process details.
   * @returns True if the file was created, false if it was skipped due to duplication.
   */
  private async createStudentFile(
    student: Student,
    t4aFileInfo: T4AFileInfo,
    formattedReferenceDate: string,
    fileUniqueID: string,
    t4aFileContent: Buffer,
    processSummary: ProcessSummary,
  ): Promise<boolean> {
    processSummary.info(`Start upload to the student account.`);
    const userFriendlyFileName = `${t4aFileInfo.directory}-${T4A_FILE_PART}-${formattedReferenceDate}`;
    const fileName = `${userFriendlyFileName}${t4aFileInfo.fileExtension}`;
    const uniqueFileName = `${userFriendlyFileName}-${fileUniqueID}${t4aFileInfo.fileExtension}`;
    const fileUploadProcessSummary = new ProcessSummary();
    processSummary.children(fileUploadProcessSummary);
    try {
      return await this.dataSource.manager.transaction(
        async (entityManager) => {
          const createdFilePromise = this.studentFileSharedService.createFile(
            {
              fileName,
              uniqueFileName,
              mimeType: "application/pdf",
              fileContent: t4aFileContent,
              groupName: T4A_FILE_GROUP_NAME,
              fileOrigin: FileOriginType.Ministry,
            },
            student.id,
            this.systemUsersService.systemUser.id,
            fileUploadProcessSummary,
            { entityManager, preventFileHashDuplication: true },
          );
          const saveNotificationPromise =
            this.notificationActionsService.saveMinistryFileUploadNotification(
              {
                firstName: student.user.firstName,
                lastName: student.user.lastName,
                toAddress: student.user.email,
                userId: student.user.id,
              },
              this.systemUsersService.systemUser.id,
              entityManager,
            );
          const [createdFile] = await Promise.all([
            createdFilePromise,
            saveNotificationPromise,
          ]);
          processSummary.info(
            `Student file ID ${createdFile.id} created and notification saved.`,
          );
          return true;
        },
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === FILE_HASH_DUPLICATION_ERROR
      ) {
        processSummary.info(
          `T4A file for student ID ${student.id} already exists: ${error.message}`,
        );
        return false;
      }
      throw error;
    }
  }
}
