import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { StudentFile, Student } from "../../database/entities";
import { CreateFile } from "./student-file.model";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(@Inject("Connection") connection: Connection) {
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
      .getMany();
  }

  @InjectLogger()
  logger: LoggerService;
}
