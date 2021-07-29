import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, UpdateResult } from "typeorm";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import {
  Application,
  ApplicationStudentFile,
  EducationProgramOffering,
  ProgramInfoStatus,
  Student,
  StudentFile,
} from "../../database/entities";
import { SequenceControlService } from "../../services/sequence-control/sequence-control.service";
import { CreateApplicationDto } from "../../route-controllers/application/models/application.model";
import { CustomNamedError } from "../../utilities";

export const PIR_REQUEST_NOT_FOUND_ERROR = "PIR_REQUEST_NOT_FOUND_ERROR";
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

  async associateAssessmentWorkflow(
    applicationId: number,
    assessmentWorkflowId: string,
  ): Promise<UpdateResult> {
    return this.repo.update({ id: applicationId }, { assessmentWorkflowId });
  }

  async getApplicationById(
    applicationId: number,
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

  /**
   * Updates Program Information Request (PIR) related data.
   * @param applicationId application id to be updated.
   * @param locationId location id related to the offering.
   * @param status status of the program information request.
   * @param offering offering id, when available, otherwise
   * a PIR request need happen to an offering id be provided.
   * @returns program info update result.
   */
  async updateProgramInfo(
    applicationId: number,
    locationId: number,
    status: ProgramInfoStatus,
    offeringId?: number,
  ): Promise<UpdateResult> {
    return this.repo.update(
      { id: applicationId },
      {
        location: { id: locationId },
        offering: { id: offeringId },
        pirStatus: status,
      },
    );
  }

  /**
   * Updates Program Information Request (PRI) status.
   * @param applicationId application id to be updated.
   * @param status status of the program information request.
   * a PIR request need happen to an offering id be provided.
   * @returns program information request status update result.
   */
  async updateProgramInfoStatus(
    applicationId: number,
    status: ProgramInfoStatus,
  ): Promise<UpdateResult> {
    return this.repo.update(
      { id: applicationId },
      {
        pirStatus: status,
      },
    );
  }

  /**
   * Set the offering for Program Info Request (PIR).
   * Once the offering is set it will be a workflow responsability
   * to set the PIR status to completed.
   * Updates only applications that have the PIR status as required.
   * @param applicationId application id to be updated.
   * @param locationId location that is setting the offering.
   * @param offeringId offering id to be set in the student application.
   * @returns updated application.
   */
  async setOfferingForProgramInfoRequest(
    applicationId: number,
    locationId: number,
    offeringId: number,
  ): Promise<Application> {
    const application = await this.repo.findOne({
      id: applicationId,
      location: { id: locationId },
      pirStatus: ProgramInfoStatus.required,
    });
    if (!application) {
      throw new CustomNamedError(
        "Not able to find an application that requires a PIR to be completed.",
        PIR_REQUEST_NOT_FOUND_ERROR,
      );
    }

    application.offering = { id: offeringId } as EducationProgramOffering;
    return this.repo.save(application);
  }

  /**
   * Gets the offering associated with an application.
   * @param applicationId application id.
   * @returns offering associated with an application or null
   * when the application does not exists or there is no
   * offering associated with it at this time.
   */
  async getOfferingByApplicationId(
    applicationId: number,
  ): Promise<EducationProgramOffering> {
    const application = await this.repo.findOne(applicationId, {
      relations: ["offering"],
    });

    return application?.offering;
  }
}
