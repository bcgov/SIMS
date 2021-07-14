import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, In } from "typeorm";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { StudentFile, Student } from "../../database/entities";
import { CreateApplicationFile } from "./student-file.model";

@Injectable()
export class StudentFileService extends RecordDataModelService<StudentFile> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(StudentFile));
  }

  async createFile(
    createFile: CreateApplicationFile,
    studentId: number,
  ): Promise<StudentFile> {
    const newFile = new StudentFile();
    newFile.fileName = createFile.fileName;
    newFile.uniqueFileName = createFile.uniqueFileName;
    newFile.groupName = createFile.groupName;
    newFile.mimeType = createFile.mimeType;
    newFile.fileContent = createFile.fileContent;
    newFile.student = { id: studentId } as Student;
    return await this.repo.save(newFile);
  }

  async getStudentFile(
    studentId: number,
    uniqueFileName: string,
  ): Promise<StudentFile> {
    return this.repo.findOne({ uniqueFileName, student: { id: studentId } });
  }

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
