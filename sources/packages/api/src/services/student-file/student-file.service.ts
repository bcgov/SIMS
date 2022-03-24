import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, In, UpdateResult } from "typeorm";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { StudentFile, Student } from "../../database/entities";
import { CreateFile } from "./student-file.model";
import { FileOriginType } from "../../database/entities/student-file.type";
import { StudentFileUploaderForm } from "../../route-controllers/student/models/student.dto";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(connection: Connection) {
    super(connection.getRepository(StudentFile));
  }

  /**
   * Creates a file and associates it with a student.
   * @param createFile
   * @param studentId
   * @returns file
   */
  async createFile(
    createFile: CreateFile,
    studentId: number,
  ): Promise<StudentFile> {
    const newFile = new StudentFile();
    newFile.fileName = createFile.fileName;
    newFile.uniqueFileName = createFile.uniqueFileName;
    newFile.groupName = createFile.groupName;
    newFile.mimeType = createFile.mimeType;
    newFile.fileContent = createFile.fileContent;
    newFile.student = { id: studentId } as Student;
    return this.repo.save(newFile);
  }

  /**
   * Gets a student file.
   * @param studentId student id.
   * @param uniqueFileName unique file name (name+guid).
   * @returns student file.
   */
  async getStudentFile(
    studentId: number,
    uniqueFileName: string,
  ): Promise<StudentFile> {
    return this.repo.findOne({ uniqueFileName, student: { id: studentId } });
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
    studentId: number,
    uniqueFileNames: string[],
    submittedData: StudentFileUploaderForm,
  ): Promise<UpdateResult> {
    return this.repo.update(
      {
        student: { id: studentId } as Student,
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
