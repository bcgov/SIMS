import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, In, UpdateResult } from "typeorm";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { StudentFile, Student, User } from "../../database/entities";
import { CreateFile } from "./student-file.model";
import {
  FileOriginType,
  StudentFileMetadata,
} from "../../database/entities/student-file.type";
import { GCNotifyResult } from "../notification/gc-notify.model";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(private readonly connection: Connection) {
    super(connection.getRepository(StudentFile));
  }

  /**
   * Creates a file and associates it with a student.
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
    return this.repo.findOne({ uniqueFileName: uniqueFileName });
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
   * @param metadata optional metadata of the file being save.
   * @param sendNotification optional notification message to be sent.
   */
  async updateStudentFiles(
    studentId: number,
    auditUserId: number,
    uniqueFileNames: string[],
    fileOrigin: FileOriginType,
    groupName: string,
    metadata?: StudentFileMetadata,
    sendNotification?: () => Promise<GCNotifyResult>,
  ): Promise<UpdateResult> {
    let updateResult: UpdateResult;
    await this.connection.transaction(async (transactionalEntityManager) => {
      updateResult = await transactionalEntityManager
        .getRepository(StudentFile)
        .update(
          {
            student: { id: studentId } as Student,
            uniqueFileName: In(uniqueFileNames),
          },
          {
            groupName,
            fileOrigin,
            metadata,
            modifier: { id: auditUserId } as User,
          },
        );
      // Executes the send notification inside the transaction to allow the rollback
      // of the DB updates in the case of the notification failure.
      if (sendNotification) {
        await sendNotification();
      }
    });
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
