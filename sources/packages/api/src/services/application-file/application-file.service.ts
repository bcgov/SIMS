import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { ApplicationFile, Student } from "../../database/entities";
import { CreateApplicationFile } from "./application-file.model";

@Injectable()
export class ApplicationFileService extends RecordDataModelService<ApplicationFile> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(ApplicationFile));
  }

  async createFile(
    createFile: CreateApplicationFile,
    studentId: number,
  ): Promise<ApplicationFile> {
    const newFile = new ApplicationFile();
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
  ): Promise<ApplicationFile> {
    return this.repo.findOne({ uniqueFileName, student: { id: studentId } });
  }

  @InjectLogger()
  logger: LoggerService;
}
