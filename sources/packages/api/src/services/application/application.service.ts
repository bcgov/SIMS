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
import { SequenceControlService } from "../../services/sequence-control/sequence-control.service";
import { CreateApplicationDto } from "../../route-controllers/application/models/application.model";

@Injectable()
export class ApplicationService extends RecordDataModelService<Application> {
  @InjectLogger()
  logger: LoggerService;

  constructor(
    @Inject("Connection") connection: Connection,
    private readonly sequenceService: SequenceControlService,
  ) {
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
    // TODO:remove the static program year and add dynamic year, from program year table
    const sequenceName = "2122";
    let nextApplicationSequence: number = NaN;
    await this.sequenceService.consumeNextSequence(
      sequenceName,
      async (nextSequenceNumber: number) => {
        nextApplicationSequence = nextSequenceNumber;
      },
    );
    const MAX_APPLICATION_NUMBER_LENGTH = 10;
    const sequenceNumberSize =
      MAX_APPLICATION_NUMBER_LENGTH - sequenceName.length;
    const applicationNumber =
      sequenceName +
      `${nextApplicationSequence}`.padStart(sequenceNumberSize, "0");
    newApplication.student = { id: studentId } as Student;
    newApplication.data = applicationDto.data;
    newApplication.studentFiles = studentFiles.map((file) => {
      const newFileAssociation = new ApplicationStudentFile();
      newFileAssociation.studentFile = { id: file.id } as StudentFile;
      return newFileAssociation;
    });
    newApplication.applicationNumber = applicationNumber;
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

  async getAssessmentByApplicationId(applicationId: number): Promise<any> {
    return this.repo
      .createQueryBuilder("application")
      .select("application.assessment")
      .where("application.id = :applicationId", { applicationId })
      .getOne();
  }

  async getAllStudentApplications(studentId: number): Promise<Application[]> {
    return await this.repo
      .createQueryBuilder("application")
      .where("application.student_id = :studentId", { studentId })
      .getMany();
  }
}
