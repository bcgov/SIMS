import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { UserInfo } from "../../types";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { Application } from "../../database/entities/application.model";
import { CreateApplicationDto } from "../../route-controllers/application/models/application.model";
import { StudentService } from "..";

@Injectable()
export class ApplicationService extends RecordDataModelService<Application> {
  @InjectLogger()
  logger: LoggerService;

  constructor(
    @Inject("Connection") connection: Connection,
    private readonly studentService: StudentService,
  ) {
    super(connection.getRepository(Application));
    this.logger.log("[Created]");
  }

  async createApplication(
    userInfo: UserInfo,
    applicationDto: CreateApplicationDto,
  ): Promise<Application> {
    // Find the student realted to the logged user.
    const student = await this.studentService.getStudentByUserName(
      userInfo.userName,
    );

    // Create the new application.
    const newApplication = new Application();
    newApplication.student = student;
    newApplication.data = applicationDto.data;

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
