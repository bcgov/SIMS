import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In, UpdateResult } from "typeorm";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  RecordDataModelService,
  StudentFile,
  Student,
  User,
  FileOriginType,
} from "@sims/sims-db";
import { CreateFile, FileUploadOptions } from "./student-file.model";
import { InjectQueue } from "@nestjs/bull";
import { QueueNames } from "@sims/utilities";
import { Queue } from "bull";
import { VirusScanQueueInDTO } from "@sims/services/queue/dto/virus-scan.dto";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(
    private readonly dataSource: DataSource,
    @InjectQueue(QueueNames.StartApplicationAssessment)
    private readonly virusScanQueue: Queue<VirusScanQueueInDTO>,
  ) {
    super(dataSource.getRepository(StudentFile));
  }

  /**
   * Creates a file and associates it with a student.
   * Subsequently, adds the file to the virus scan queue
   * to scan for any viruses.
   * @param createFile file to be created.
   * @param studentId student that will have the file associated.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @returns saved student file record.
   */
  async createFile(
    createFile: CreateFile,
    studentId: number,
    auditUserId: number,
  ): Promise<StudentFile> {
    const newFile = new StudentFile();
    newFile.fileName = createFile.fileName;
    newFile.uniqueFileName = createFile.uniqueFileName;
    newFile.groupName = createFile.groupName;
    newFile.mimeType = createFile.mimeType;
    newFile.fileContent = createFile.fileContent;
    newFile.student = { id: studentId } as Student;
    newFile.creator = { id: auditUserId } as User;

    // Add to the virus scan queue.
    await this.virusScanQueue.add({
      uniqueFileName: createFile.uniqueFileName,
    });

    return this.repo.save(newFile);
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
        "studentFile.mimeType",
        "studentFile.fileContent",
      ])
      .where("studentFile.uniqueFileName = :uniqueFileName", {
        uniqueFileName,
      });

    if (studentId) {
      query.andWhere("studentFile.student.id = :studentId", { studentId });
    }

    return query.getOne();
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
        "studentFile.updatedAt",
        "studentFile.fileOrigin",
      ])
      .where("studentFile.student.id = :studentId", { studentId })
      .andWhere("studentFile.fileOrigin IN (:...fileOrigin)", {
        fileOrigin: [FileOriginType.Student, FileOriginType.Ministry],
      })
      .orderBy("studentFile.createdAt", "DESC")
      .getMany();
  }
  @InjectLogger()
  logger: LoggerService;
}
