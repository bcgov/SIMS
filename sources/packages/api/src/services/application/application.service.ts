import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, UpdateResult } from "typeorm";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import {
  Application,
  ApplicationStudentFile,
  Student,
  StudentFile,
} from "../../database/entities";
import {
  CreateApplicationDto,
  ApplicationDto,
  ApplicationAssessmentDTO,
} from "../../route-controllers/application/models/application.model";

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

  async updateAssessmentInApplication(
    applicationId: number,
    assessment: any,
  ): Promise<UpdateResult> {
    return this.repo.update(applicationId, { assessment });
  }

  async getAssessmentByApplicationId(
    applicationId: number,
  ): Promise<ApplicationAssessmentDTO> {
    const application = await this.repo
      .createQueryBuilder("application")
      .select("application.assessment")
      .where("application.id = :applicationId", { applicationId })
      .getOne();
    return {
      weeks: application.assessment.weeks,
      federal_assessment_need: application.assessment.federal_assessment_need,
      provincial_assessment_need:
        application.assessment.provincial_assessment_need,
      total_federal_award: application.assessment.total_federal_award,
      total_provincial_award: application.assessment.total_provincial_award,
    };
  }
}
