import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, In, UpdateResult } from "typeorm";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { StudentFile, Student, User } from "../../database/entities";
import { CreateFile } from "./student-file.model";
import { FileOriginType } from "../../database/entities/student-file.type";
import { StudentFileUploaderForm } from "../../route-controllers/student/models/student.dto";
import { GCNotifyActionsService } from "../notification/gc-notify-actions.service";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(
    private readonly connection: Connection,
    private readonly gcNotifyActionsService: GCNotifyActionsService,
  ) {
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
   * @param studentId student id.
   * @param uniqueFileNames list of unique file names.
   */
  async updateStudentFiles(
    student: Student,
    uniqueFileNames: string[],
    submittedData: StudentFileUploaderForm,
  ): Promise<UpdateResult> {
    let updateResult: UpdateResult;
    await this.connection.transaction(async (transactionalEntityManager) => {
      updateResult = await transactionalEntityManager
        .getRepository(StudentFile)
        .update(
          {
            student,
            uniqueFileName: In(uniqueFileNames),
          },
          {
            groupName: submittedData.documentPurpose,
            fileOrigin: FileOriginType.Student,
            metadata: submittedData.applicationNumber
              ? { applicationNumber: submittedData.applicationNumber }
              : null,
          },
        );
      await this.gcNotifyActionsService.sendFileUploadNotification(
        student,
        submittedData.documentPurpose,
        submittedData.applicationNumber,
      );
    });
    return updateResult;
  }

  /**
   * Gets a list of student files uploaded via student Uploader
   * (i.e, fileOrigin is FileOriginType.Student).
   * @param studentId student id.
   * @returns student files
   */
  async getStudentUploadedFiles(studentId: number): Promise<StudentFile[]> {
    return this.repo
      .createQueryBuilder("studentFile")
      .where("studentFile.student.id = :studentId", { studentId })
      .andWhere("studentFile.fileOrigin = :fileOrigin", {
        fileOrigin: FileOriginType.Student,
      })
      .select([
        "studentFile.uniqueFileName",
        "studentFile.fileName",
        "studentFile.metadata",
        "studentFile.groupName",
        "studentFile.updatedAt",
      ])
      .getMany();
  }
  @InjectLogger()
  logger: LoggerService;
}
