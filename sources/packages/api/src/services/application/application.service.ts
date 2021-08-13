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
  ApplicationStatus,
  Student,
  StudentFile,
} from "../../database/entities";
import { CreateApplicationDto } from "../../route-controllers/application/models/application.model";
import { CustomNamedError } from "../../utilities";
import { SequenceControlService } from "../sequence-control/sequence-control.service";
import { StudentFileService } from "../student-file/student-file.service";

export const PIR_REQUEST_NOT_FOUND_ERROR = "PIR_REQUEST_NOT_FOUND_ERROR";
export const APPLICATION_DRAFT_NOT_FOUND = "APPLICATION_DRAFT_NOT_FOUND";
export const ONLY_ONE_DRAFT_ERROR =
  "ONLY_ONE_APPLICATION_DRAFT_PER_STUDENT_ALLOWED";
@Injectable()
export class ApplicationService extends RecordDataModelService<Application> {
  @InjectLogger()
  logger: LoggerService;

  constructor(
    @Inject("Connection") connection: Connection,
    private readonly sequenceService: SequenceControlService,
    private readonly fileService: StudentFileService,
  ) {
    super(connection.getRepository(Application));
    this.logger.log("[Created]");
  }

  async submitApplication(
    applicationId: number,
    applicationDto: CreateApplicationDto,
    studentFiles: StudentFile[],
  ): Promise<Application> {
    const application = await this.repo.findOne(applicationId);
    if (application.applicationStatus !== ApplicationStatus.draft) {
      throw new Error(
        "Student Application is not in the correct status to be submitted.",
      );
    }

    // TODO:remove the static program year and add dynamic year, from program year table
    application.applicationNumber = await this.generateApplicationNumber(
      "2122",
    );

    application.data = applicationDto.data;
    application.applicationStatus = ApplicationStatus.submitted;

    application.studentFiles = studentFiles.map((file) => {
      const newFileAssociation = new ApplicationStudentFile();
      newFileAssociation.studentFile = { id: file.id } as StudentFile;
      return newFileAssociation;
    });

    return await this.repo.save(application);
  }

  private async generateApplicationNumber(
    sequenceName: string,
  ): Promise<string> {
    const MAX_APPLICATION_NUMBER_LENGTH = 10;
    const sequenceNumberSize =
      MAX_APPLICATION_NUMBER_LENGTH - sequenceName.length;

    let nextApplicationSequence: number = NaN;
    await this.sequenceService.consumeNextSequence(
      sequenceName,
      async (nextSequenceNumber: number) => {
        nextApplicationSequence = nextSequenceNumber;
      },
    );

    return (
      sequenceName +
      `${nextApplicationSequence}`.padStart(sequenceNumberSize, "0")
    );
  }

  async associateAssessmentWorkflow(
    applicationId: number,
    assessmentWorkflowId: string,
  ): Promise<UpdateResult> {
    return this.repo.update({ id: applicationId }, { assessmentWorkflowId });
  }

  /**
   * Gets the Program Information Request
   * associated with the application.
   * @param locationId location id.
   * @param applicationId application id.
   * @returns student application with Program Information Request.
   */
  async getProgramInfoRequest(
    locationId: number,
    applicationId: number,
  ): Promise<Application> {
    return this.repo
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.pirProgram", "pirProgram")
      .leftJoinAndSelect("application.student", "student")
      .leftJoinAndSelect("application.location", "location")
      .leftJoinAndSelect("application.offering", "offering")
      .leftJoinAndSelect("offering.educationProgram", "offeringProgram")
      .leftJoinAndSelect("student.user", "user")
      .where("application.id = :applicationId", {
        applicationId,
      })
      .andWhere("location.id = :locationId", { locationId })
      .getOne();
  }

  async getApplicationByIdAndUser(
    applicationId: number,
    userId: number,
  ): Promise<Application> {
    const application = await this.repo
      .createQueryBuilder("application")
      .leftJoin("application.student", "student")
      .leftJoin("student.user", "user")
      .where("application.id = :applicationIdParam", {
        applicationIdParam: applicationId,
      })
      .andWhere("user.id = :userId", { userId })
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
   * get all student applications.
   * @param studentId student id .
   * @returns student Application list.
   */
  async getAllStudentApplications(studentId: number): Promise<Application[]> {
    return this.repo
      .createQueryBuilder("application")
      .select([
        "application.applicationNumber",
        "application.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
      ])
      .leftJoin("application.offering", "offering")
      .where("application.student_id = :studentId", { studentId })
      .getMany();
  }

  async getApplicationByStatus(
    studentId: number,
    status: ApplicationStatus,
  ): Promise<Application> {
    return await this.repo
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.studentFiles", "studentFiles")
      .where("application.student_id = :studentId", { studentId })
      .andWhere("application.applicationStatus = :status", { status })
      .getOne();
  }

  async saveDraftApplication(
    studentId: number,
    data: any,
    associatedFiles: string[],
    applicationId?: number,
  ): Promise<Application> {
    let draftApplication = await this.getApplicationByStatus(
      studentId,
      ApplicationStatus.draft,
    );

    if (applicationId && !draftApplication) {
      throw new CustomNamedError(
        "Not able to find the draft application associated with the student.",
        APPLICATION_DRAFT_NOT_FOUND,
      );
    }

    if (draftApplication && draftApplication.id !== applicationId) {
      throw new CustomNamedError(
        "There is already an existing draft application associated with the current student.",
        ONLY_ONE_DRAFT_ERROR,
      );
    }

    if (!draftApplication) {
      draftApplication = new Application();
    }

    draftApplication.data = data;
    draftApplication.student = { id: studentId } as Student;
    draftApplication.applicationStatus = ApplicationStatus.draft;

    // Check for the existing student files if
    // some association was provided.
    let studentFiles: StudentFile[] = [];
    if (associatedFiles?.length) {
      studentFiles = await this.fileService.getStudentFiles(
        studentId,
        associatedFiles,
      );
    }

    // Associate uploaded files with the application.
    draftApplication.studentFiles = studentFiles.map((file) => {
      const fileAssociation = new ApplicationStudentFile();
      fileAssociation.studentFile = { id: file.id } as StudentFile;
      return fileAssociation;
    });

    return this.repo.save(draftApplication);
  }

  /**
   * Updates Program Information Request (PIR) related data.
   * @param applicationId application id to be updated.
   * @param locationId location id related to the offering.
   * @param status status of the program information request.
   * @param programId program id related to the application.
   * When the application do not have an offering, this is used
   * to determine the associated program.
   * @param offering offering id, when available, otherwise
   * a PIR request need happen to an offering id be provided.
   * @returns program info update result.
   */
  async updateProgramInfo(
    applicationId: number,
    locationId: number,
    status: ProgramInfoStatus,
    programId?: number,
    offeringId?: number,
  ): Promise<UpdateResult> {
    return this.repo.update(
      { id: applicationId },
      {
        location: { id: locationId },
        pirProgram: { id: programId },
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
   * @param offering offering to be set in the student application.
   * @returns updated application.
   */
  async setOfferingForProgramInfoRequest(
    applicationId: number,
    locationId: number,
    offering: EducationProgramOffering,
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

    application.offering = offering;
    application.pirStatus = ProgramInfoStatus.submitted;
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
  /**
   * get applications of a institution location
   * with PIR status required and completed.
   * @param locationId location id .
   * @returns student Application list.
   */
  async getPIRApplications(locationId: number): Promise<Application[]> {
    return this.repo
      .createQueryBuilder("application")
      .select([
        "application.applicationNumber",
        "application.id",
        "application.pirStatus",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "student",
      ])
      .leftJoin("application.offering", "offering")
      .leftJoin("application.student", "student")
      .leftJoinAndSelect("student.user", "user")
      .where("application.location.id = :locationId", { locationId })
      .andWhere("application.pirStatus != :nonPirStatus", {
        nonPirStatus: ProgramInfoStatus.notRequired,
      })
      .orderBy(
        `CASE application.pirStatus
            WHEN '${ProgramInfoStatus.required}' THEN 1
            WHEN '${ProgramInfoStatus.submitted}' THEN 2
            WHEN '${ProgramInfoStatus.completed}' THEN 3
            WHEN '${ProgramInfoStatus.declined}' THEN 4
            ELSE 5
          END`,
      )
      .addOrderBy("application.applicationNumber")
      .getMany();
  }
}
