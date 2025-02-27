import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In, UpdateResult } from "typeorm";
import {
  LoggerService,
  InjectLogger,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  RecordDataModelService,
  StudentFile,
  Student,
  User,
  VirusScanStatus,
  FileOriginType,
} from "@sims/sims-db";
import { CreateFile, FileUploadOptions } from "./student-file.model";
import { InjectQueue } from "@nestjs/bull";
import { CustomNamedError, QueueNames } from "@sims/utilities";
import { Queue } from "bull";
import { VirusScanQueueInDTO } from "@sims/services/queue";
import { FILE_SAVE_ERROR } from "../../constants";
import { ObjectStorageService } from "@sims/integrations/object-storage";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly objectStorageService: ObjectStorageService,
    @InjectQueue(QueueNames.FileVirusScanProcessor)
    private readonly virusScanQueue: Queue<VirusScanQueueInDTO>,
  ) {
    super(dataSource.getRepository(StudentFile));
  }

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

    summary.info(`Saving the file ${createFile.fileName} to database.`);
    let savedFile: StudentFile;
    try {
      savedFile = await this.repo.save(newFile);
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
      await this.repo.update(
        { uniqueFileName: newFile.uniqueFileName },
        { virusScanStatus: VirusScanStatus.Pending },
      );
    }
  }

  /**
   * Gets a student file.
   * @param uniqueFileName unique file name (name+guid).
   * @param studentId student id.
   * @returns student file.
   */
  async getStudentFile(
    uniqueFileName: string,
    studentId?: number,
  ): Promise<StudentFile> {
    const query = this.repo
      .createQueryBuilder("studentFile")
      .select([
        "studentFile.id",
        "studentFile.fileName",
        "studentFile.virusScanStatus",
      ])
      .where("studentFile.uniqueFileName = :uniqueFileName", {
        uniqueFileName,
      });

    if (studentId) {
      query.andWhere("studentFile.student.id = :studentId", { studentId });
    }
    const studentFile = await query.getOne();
    return studentFile;
  }

  /**
   * Gets a student file.
   * This method is exclusively for the ministry user purpose.
   * For a ministry user student id validation is not required.
   * @param uniqueFileName unique file name (name+guid).
   * @returns student file.
   */
  async getStudentFileByUniqueName(
    uniqueFileName: string,
  ): Promise<StudentFile> {
    return this.repo.findOne({ where: { uniqueFileName: uniqueFileName } });
  }

  /**
   * Gets a list of student files using the unique names for search them.
   * @param studentId student id.
   * @param uniqueFileNames list of unique file names.
   * @returns student files
   */
  async getStudentFiles(
    studentId: number,
    uniqueFileNames: string[],
  ): Promise<StudentFile[]> {
    return this.repo
      .createQueryBuilder("studentFile")
      .where("studentFile.student.id = :studentId", { studentId })
      .andWhere("studentFile.uniqueFileName IN (:...uniqueFileNames)", {
        uniqueFileNames,
      })
      .select("studentFile.id")
      .addSelect("studentFile.uniqueFileName")
      .addSelect("studentFile.fileName")
      .getMany();
  }

  /**
   * Update the files submitted by the student
   * with proper data.
   * @param studentId student.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param uniqueFileNames list of unique file names.
   * @param fileOrigin origin of the file being saved.
   * @param groupName group name of the file being save.
   * @param options file upload options.
   */
  async updateStudentFiles(
    studentId: number,
    auditUserId: number,
    uniqueFileNames: string[],
    fileOrigin: FileOriginType,
    options?: FileUploadOptions,
  ): Promise<UpdateResult> {
    let updateResult: UpdateResult;
    if (options.entityManager) {
      updateResult = await this.updateStudentFile(
        options.entityManager,
        studentId,
        auditUserId,
        uniqueFileNames,
        fileOrigin,
        options,
      );
    } else {
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        updateResult = await this.updateStudentFile(
          transactionalEntityManager,
          studentId,
          auditUserId,
          uniqueFileNames,
          fileOrigin,
          options,
        );
      });
    }

    return updateResult;
  }

  /**
   * Gets a list of student files from the student account
   * (i.e, fileOrigin is FileOriginType.Student or FileOriginType.Ministry).
   * @param studentId student id.
   * @returns student files from the student account.
   */
  async getStudentUploadedFiles(studentId: number): Promise<StudentFile[]> {
    return this.repo
      .createQueryBuilder("studentFile")
      .select([
        "studentFile.uniqueFileName",
        "studentFile.fileName",
        "studentFile.metadata",
        "studentFile.groupName",
        "studentFile.createdAt",
        "studentFile.fileOrigin",
      ])
      .where("studentFile.student.id = :studentId", { studentId })
      .andWhere("studentFile.fileOrigin IN (:...fileOrigin)", {
        fileOrigin: [FileOriginType.Student, FileOriginType.Ministry],
      })
      .orderBy("studentFile.createdAt", "DESC")
      .getMany();
  }

  /**
   * Update the files submitted by the student
   * with proper data.
   * @param entityManager entity manager for a given transaction.
   * @param studentId student.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param uniqueFileNames list of unique file names.
   * @param fileOrigin origin of the file being saved.
   * @param groupName group name of the file being save.
   * @param options file upload options.
   */
  private async updateStudentFile(
    entityManager: EntityManager,
    studentId: number,
    auditUserId: number,
    uniqueFileNames: string[],
    fileOrigin: FileOriginType,
    options?: FileUploadOptions,
  ): Promise<UpdateResult> {
    if (options?.saveFileUploadNotification) {
      await options.saveFileUploadNotification(entityManager);
    }
    return entityManager.getRepository(StudentFile).update(
      {
        student: { id: studentId },
        uniqueFileName: In(uniqueFileNames),
      },
      {
        groupName: options?.groupName,
        fileOrigin,
        metadata: options?.metadata,
        modifier: { id: auditUserId } as User,
      },
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
