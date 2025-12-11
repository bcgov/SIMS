import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In, UpdateResult } from "typeorm";
import {
  RecordDataModelService,
  StudentFile,
  User,
  FileOriginType,
} from "@sims/sims-db";
import { FileUploadOptions } from "./student-file.model";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(StudentFile));
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
        "creator.firstName",
        "creator.lastName",
      ])
      .innerJoin("studentFile.creator", "creator")
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
}
