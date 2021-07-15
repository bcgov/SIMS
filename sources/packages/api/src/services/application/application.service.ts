import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import {
  Application,
  ApplicationStudentFile,
  Student,
  StudentFile,
} from "../../database/entities";
import { CreateApplicationDto } from "../../route-controllers/application/models/application.model";

@Injectable()
export class ApplicationService extends RecordDataModelService<Application> {
  @InjectLogger()
  logger: LoggerService;

  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(Application));
    this.logger.log("[Created]");
  }

  async createApplication(
    studentId: number,
    applicationDto: CreateApplicationDto,
    studentFiles: StudentFile[],
  ): Promise<Application> {
    // Create the new application.
    const newApplication = new Application();
    newApplication.student = { id: studentId } as Student;
    newApplication.data = applicationDto.data;
    newApplication.studentFiles = studentFiles.map((file) => {
      const newFileAssociation = new ApplicationStudentFile();
      newFileAssociation.studentFile = { id: file.id } as StudentFile;
      return newFileAssociation;
    });
    return await this.repo.save(newApplication);
  }

  async getApplicationById(
    applicationId: string,
    userName: string,
  ): Promise<Application> {
    const application = await this.repo
      .createQueryBuilder("application")
      .leftJoin("application.student", "student")
      .leftJoin("student.user", "user")
      .where("application.id = :applicationIdParam", {
        applicationIdParam: applicationId,
      })
      .andWhere("user.userName = :userNameParam", { userNameParam: userName })
      .getOne();
    return application;
  }
}
