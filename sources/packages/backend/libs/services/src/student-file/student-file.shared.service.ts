import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { ProcessSummary } from "@sims/utilities/logger";
import { StudentFile, Student, User, VirusScanStatus } from "@sims/sims-db";
import { CreateFile } from "./models/student-file-shared.models";
import { InjectQueue } from "@nestjs/bull";
import { CustomNamedError, hashObjectToHex, QueueNames } from "@sims/utilities";
import { Queue } from "bull";
import { VirusScanQueueInDTO } from "@sims/services/queue";
import { FILE_SAVE_ERROR } from "../constants";
import { ObjectStorageService } from "@sims/integrations/object-storage";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class StudentFileSharedService {
  constructor(
    private readonly objectStorageService: ObjectStorageService,
    @InjectRepository(StudentFile)
    private readonly studentFileRepo: Repository<StudentFile>,
    @InjectQueue(QueueNames.FileVirusScanProcessor)
    private readonly virusScanQueue: Queue<VirusScanQueueInDTO>,
  ) {}

  /**
   * Saves the file metadata to db and the file contents
   * to the S3 file storage and associates it with the student.
   * Subsequently, adds the file to the virus scan queue
   * to scan for any viruses.
   * @param createFile file to be created.
   * @param studentId student that will have the file associated.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param summary process summary logger.
   * @returns saved student file record.
   */
  async createFile(
    createFile: CreateFile,
    studentId: number,
    auditUserId: number,
    summary: ProcessSummary,
  ): Promise<StudentFile> {
    try {
      summary.info(`Uploading file ${createFile.fileName} to S3 storage.`);
      await this.objectStorageService.putObject({
        key: createFile.uniqueFileName,
        contentType: createFile.mimeType,
        body: createFile.fileContent,
      });
      summary.info(`File ${createFile.fileName} uploaded to S3 storage.`);
    } catch (error: unknown) {
      summary.error(`Error while uploading ${createFile.fileName}.`, error);
      throw new CustomNamedError(
        `Unexpected error while uploading the file ${createFile.fileName}.`,
        FILE_SAVE_ERROR,
      );
    }
    const newFile = new StudentFile();
    newFile.fileName = createFile.fileName;
    newFile.uniqueFileName = createFile.uniqueFileName;
    newFile.groupName = createFile.groupName;
    newFile.student = { id: studentId } as Student;
    newFile.creator = { id: auditUserId } as User;
    newFile.virusScanStatus = VirusScanStatus.InProgress;
    // Generate the file hash.
    newFile.fileHash = hashObjectToHex(createFile.fileContent);
    newFile.fileOrigin = createFile.fileOrigin;

    summary.info(`Saving the file ${createFile.fileName} to database.`);
    let savedFile: StudentFile;
    try {
      savedFile = await this.studentFileRepo.save(newFile);
    } catch (error: unknown) {
      summary.error("Error saving the file.", error);
      throw new CustomNamedError(
        `Unexpected error while uploading the file ${newFile.fileName}.`,
        FILE_SAVE_ERROR,
      );
    }
    // Add to the virus scan queue only if the file is successfully saved to the database.
    try {
      summary.info(
        `Adding the file: ${newFile.fileName} to the virus scan queue.`,
      );
      await this.virusScanQueue.add({
        uniqueFileName: createFile.uniqueFileName,
        fileName: createFile.fileName,
      });
      summary.info(
        `File ${newFile.fileName} has been added to the virus scan queue.`,
      );
      return savedFile;
    } catch (error: unknown) {
      // If adding the file to the virus scanning queue fails,
      // then revert the file virus scan status in the database to pending.
      summary.error(
        `Error while enqueueing the file ${newFile.fileName} for virus scanning.`,
        error,
      );
      await this.studentFileRepo.update(
        { uniqueFileName: newFile.uniqueFileName },
        { virusScanStatus: VirusScanStatus.Pending },
      );
    }
  }
}
