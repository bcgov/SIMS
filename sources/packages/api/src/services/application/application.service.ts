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
  ApplicationAssessmentDTO,
  ApplicationDto,
  GetApplicationDataDto,
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
    application: GetApplicationDataDto,
    assessment: ApplicationAssessmentDTO,
  ): Promise<UpdateResult> {
    const populatedApplication = await this.populateApplication(
      application,
      assessment,
    );
    return this.repo.update(applicationId, populatedApplication);
  }

  async populateApplication(
    applicationDto: GetApplicationDataDto,
    assessment: ApplicationAssessmentDTO,
  ): Promise<ApplicationDto> {
    const application = new ApplicationDto();
    application.data = applicationDto.data;
    application.assessment = {
      weeks: assessment.weeks,
      federal_assessment_need: assessment.federal_assessment_need,
      provincial_assessment_need: assessment.provincial_assessment_need,
      total_federal_award: assessment.total_federal_award,
      total_provincial_award: assessment.total_provincial_award,
    };
    return application;
  }

  async getAssessmentByApplicationId(applicationId: number): Promise<any> {
    return this.repo
      .createQueryBuilder("application")
      .select("application.assessment")
      .where("application.id = :applicationIdParam", {
        applicationIdParam: applicationId,
      })
      .getOne();
  }
}
