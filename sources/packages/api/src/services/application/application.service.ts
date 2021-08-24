import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, Not, UpdateResult } from "typeorm";
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
  AssessmentStatus,
  COEStatus,
  ProgramYear,
  InstitutionLocation,
  EducationProgram,
} from "../../database/entities";
import { SequenceControlService } from "../../services/sequence-control/sequence-control.service";
import { CustomNamedError, common } from "../../utilities";
import { StudentFileService } from "../student-file/student-file.service";
import { ApplicationOverriddenResult } from "./application.models";
import { WorkflowActionsService } from "../workflow/workflow-actions.service";

const { getUTCNow } = common();

export const PIR_REQUEST_NOT_FOUND_ERROR = "PIR_REQUEST_NOT_FOUND_ERROR";
export const APPLICATION_DRAFT_NOT_FOUND = "APPLICATION_DRAFT_NOT_FOUND";
export const MORE_THAN_ONE_APPLICATION_DRAFT_ERROR =
  "ONLY_ONE_APPLICATION_DRAFT_PER_STUDENT_ALLOWED";
export const APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND";
export const INVALID_OPERATION_IN_THE_CURRENT_STATUS =
  "INVALID_OPERATION_IN_THE_CURRENT_STATUS";

@Injectable()
export class ApplicationService extends RecordDataModelService<Application> {
  @InjectLogger()
  logger: LoggerService;

  constructor(
    @Inject("Connection") connection: Connection,
    private readonly sequenceService: SequenceControlService,
    private readonly fileService: StudentFileService,
    private readonly workflow: WorkflowActionsService,
  ) {
    super(connection.getRepository(Application));
    this.logger.log("[Created]");
  }

  /**
   * Submits a Student Application.
   * The system ensures that there is an application draft prior
   * to the application submission.
   * @param applicationId application id that must be updated to submitted.
   * @param studentId student id for authorization validations.
   * @param programYearId program year associated with the submission.
   * @param applicationData dynamic data received from Form.IO form.
   * @param associatedFiles associated uploaded files.
   * @returns the updated application.
   */
  async submitApplication(
    applicationId: number,
    studentId: number,
    programYearId: number,
    applicationData: any,
    associatedFiles: string[],
  ): Promise<Application> {
    let application = await this.getApplicationToSave(
      studentId,
      ApplicationStatus.draft,
      applicationId,
    );
    // If the application was not found it is because it does not belongs to the
    // student or it is not in draft state. Either way it will be invalid.
    if (!application) {
      throw new Error(
        "Student Application not found or it is not in the correct status to be submitted.",
      );
    }
    // If the the draft was created under a different program year than
    // the one being used to submit it, it is not valid.
    if (application.programYear.id !== programYearId) {
      throw new Error(
        "Student Application program year is not the expected one.",
      );
    }

    // TODO:remove the static program year and add dynamic year, from program year table
    application.applicationNumber = await this.generateApplicationNumber(
      "2122",
    );

    application.data = applicationData;
    application.applicationStatus = ApplicationStatus.submitted;
    application.applicationStatusUpdatedOn = getUTCNow();
    application.studentFiles = await this.getSyncedApplicationFiles(
      studentId,
      application.studentFiles,
      associatedFiles,
    );

    return this.repo.save(application);
  }

  /**
   * Generates the unique application number that the application
   * receives once the application is submitted.
   * @param sequenceName name of the sequence that controls the
   * number increment.
   * @returns new unique application number.
   */
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

  /**
   * Saves an Student Application in draft state.
   * If the application id is provided an update is performed,
   * otherwise the draft will be created. The validations are also
   * applied accordingly to update/create scenarios.
   * @param studentId student id.
   * @param programYearId program year associated with the application draft.
   * @param applicationData dynamic data received from Form.IO form.
   * @param associatedFiles associated uploaded files.
   * @param [applicationId] application id used to execute validations.
   * @returns Student Application saved draft.
   */
  async saveDraftApplication(
    studentId: number,
    programYearId: number,
    applicationData: any,
    associatedFiles: string[],
    applicationId?: number,
  ): Promise<Application> {
    let draftApplication = await this.getApplicationToSave(
      studentId,
      ApplicationStatus.draft,
    );
    // If an application id is provided it means that an update is supposed to happen,
    // so an application draft is expected to be find. If not found, thown an error.
    if (applicationId && !draftApplication) {
      throw new CustomNamedError(
        "Not able to find the draft application associated with the student.",
        APPLICATION_DRAFT_NOT_FOUND,
      );
    }
    // If an application id is not provided, an insert is supposed to happen
    // but, if an draft application already exists, it means that it is an
    // attempt to create a second draft and the student is supposed to
    // have only one draft.
    if (!applicationId && draftApplication) {
      throw new CustomNamedError(
        "There is already an existing draft application associated with the current student.",
        MORE_THAN_ONE_APPLICATION_DRAFT_ERROR,
      );
    }
    // If an application id is provided, an update is supposed to happen
    // but, if an draft application already exists under a different program year
    // the operation should not be allowed.
    if (draftApplication && draftApplication.programYear.id !== programYearId) {
      throw new Error(
        "The application is already saved under a different program year.",
      );
    }
    // If there is no draft application, create one
    // and initialize the necessary data.
    if (!draftApplication) {
      draftApplication = new Application();
      draftApplication.student = { id: studentId } as Student;
      draftApplication.programYear = { id: programYearId } as ProgramYear;
      draftApplication.applicationStatus = ApplicationStatus.draft;
      draftApplication.applicationStatusUpdatedOn = getUTCNow();
    }

    // Below data must be always updated.
    draftApplication.data = applicationData;
    draftApplication.studentFiles = await this.getSyncedApplicationFiles(
      studentId,
      draftApplication.studentFiles,
      associatedFiles,
    );

    return this.repo.save(draftApplication);
  }

  /**
   * Look for files that are already stored for student and
   * application to define the associations that need to be
   * created or just kept.
   * @param studentId student id to check for the files associations.
   * @param applicationFiles current files associations.
   * @param [filesToAssociate] files associations that represents the
   * final state that the associations must have.
   * @returns an array with the files associations that should be
   * persisted in the Student Application.
   */
  private async getSyncedApplicationFiles(
    studentId: number,
    applicationFiles: ApplicationStudentFile[],
    filesToAssociate?: string[],
  ): Promise<ApplicationStudentFile[]> {
    // Check for the existing student files if
    // some association was provided.
    let studentStoredFiles: StudentFile[] = [];
    if (filesToAssociate?.length) {
      studentStoredFiles = await this.fileService.getStudentFiles(
        studentId,
        filesToAssociate,
      );
    }

    // Associate uploaded files with the application.
    return studentStoredFiles.map((studentStoredFile: StudentFile) => {
      // Use the unique file name to check if the file is already
      // associated with the current application.
      const existingAssociation = applicationFiles.find(
        (applicationFile: ApplicationStudentFile) =>
          applicationFile.studentFile.uniqueFileName ===
          studentStoredFile.uniqueFileName,
      );

      if (existingAssociation) {
        // Keep the existing association.
        return existingAssociation;
      }
      // Create a new association.
      const fileAssociation = new ApplicationStudentFile();
      fileAssociation.studentFile = {
        id: studentStoredFile.id,
      } as StudentFile;
      return fileAssociation;
    });
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

  async getApplicationById(applicationId: number): Promise<Application> {
    const application = this.repo
      .createQueryBuilder("application")
      .select(["application", "programYear.programYear"])
      .innerJoin("application.programYear", "programYear")
      .where("programYear.active = true")
      .andWhere("application.id = :applicationId", {
        applicationId,
      });
    return application.getOne();
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
        "application.applicationStatus",
      ])
      .leftJoin("application.offering", "offering")
      .where("application.student_id = :studentId", { studentId })
      .getMany();
  }

  /**
   * Gets a application with the data needed to process
   * the operations related to save/submitting an
   * Student Application.
   * @param studentId student id.
   * @param status expected status for the application.
   * @param [applicationId] apllication id, when possible.
   * @returns application with the data needed to process
   * the operations related to save/submitting.
   */
  private async getApplicationToSave(
    studentId: number,
    status: ApplicationStatus,
    applicationId?: number,
  ): Promise<Application> {
    let query = this.repo
      .createQueryBuilder("application")
      .select([
        "application",
        "programYear.id",
        "studentFiles",
        "studentFile.uniqueFileName",
      ])
      .innerJoin("application.programYear", "programYear")
      .leftJoin("application.studentFiles", "studentFiles")
      .leftJoin("studentFiles.studentFile", "studentFile")
      .where("application.student.id = :studentId", { studentId })
      .andWhere("programYear.active = true")
      .andWhere("application.applicationStatus = :status", { status });
    if (applicationId) {
      query = query.andWhere("application.id = :applicationId", {
        applicationId,
      });
    }

    return query.getOne();
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
   * Updates Assessment status.
   * @param applicationId application id to be updated.
   * @param status status of the Assessment.
   * An assessment need to happen, when the application_status is in assessment.
   * @returns assessment status update result.
   */
  async updateAssessmentStatus(
    applicationId: number,
    status: AssessmentStatus,
  ): Promise<UpdateResult> {
    return this.repo.update(
      { id: applicationId },
      {
        assessmentStatus: status,
      },
    );
  }

  /**
   * Updates Confirmation of Enrollment(COE) status.
   * @param applicationId application id to be updated.
   * @param status status of the Confirmation of Enrollment.
   * Confirmation of Enrollment need to happen, when the application_status is in enrollment.
   * @returns COE status update result.
   */
  async updateCOEStatus(
    applicationId: number,
    status: COEStatus,
  ): Promise<UpdateResult> {
    return this.repo.update(
      { id: applicationId },
      {
        coeStatus: status,
      },
    );
  }

  /**
   * Updates overall Application status.
   * @param applicationId application id to be updated.
   * @param status status of the Application.
   * @returns COE status update result.
   */
  async studentConfirmAssessment(
    applicationId: number,
    studentId: number,
  ): Promise<UpdateResult> {
    return this.repo.update(
      {
        id: applicationId,
        student: { id: studentId },
        applicationStatus: ApplicationStatus.assessment,
      },
      {
        assessmentStatus: AssessmentStatus.completed,
        applicationStatus: ApplicationStatus.enrollment,
        coeStatus: COEStatus.required,
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
      .innerJoin("application.student", "student")
      .innerJoinAndSelect("student.user", "user")
      .where("application.location.id = :locationId", { locationId })
      .andWhere("application.pirStatus is not null")
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
  /**
   * Update Student Application status.
   * Only allow the application with Non Completed status to update the status
   * @param applicationId application id.
   * @param applicationStatus application status that need to be updated.
   * @returns student Application UpdateResult.
   */
  async updateApplicationStatus(
    applicationId: number,
    applicationStatus: ApplicationStatus,
  ): Promise<UpdateResult> {
    return this.repo.update(
      {
        id: applicationId,
        applicationStatus: Not(ApplicationStatus.completed),
      },
      {
        applicationStatus: applicationStatus,
        applicationStatusUpdatedOn: getUTCNow(),
      },
    );
  }

  /**
   * get applications of a institution location
   * with COE status required and completed.
   * @param locationId location id .
   * @returns student Application list.
   */
  async getCOEApplications(locationId: number): Promise<Application[]> {
    return this.repo
      .createQueryBuilder("application")
      .select([
        "application.applicationNumber",
        "application.id",
        "application.coeStatus",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "student",
      ])
      .innerJoin("application.offering", "offering")
      .innerJoin("application.student", "student")
      .innerJoinAndSelect("student.user", "user")
      .where("application.location.id = :locationId", { locationId })
      .andWhere("application.coeStatus is not null")
      .andWhere("application.coeStatus != :nonCOEStatus", {
        nonCOEStatus: COEStatus.notRequired,
      })
      .orderBy(
        `CASE application.coeStatus
          WHEN '${COEStatus.required}' THEN 1
          WHEN '${COEStatus.completed}' THEN 2
          WHEN '${COEStatus.declined}' THEN 3
          ELSE 4
        END`,
      )
      .addOrderBy("application.applicationNumber")
      .getMany();
  }

  /**
   * Gets program year details for a student application
   * @param studentId student id.
   * @param applicationId application id.
   * @returns program year details for a student application.
   */
  async getProgramYearOfApplication(
    studentId: number,
    applicationId: number,
  ): Promise<Application> {
    let query = this.repo
      .createQueryBuilder("application")
      .innerJoinAndSelect("application.programYear", "programYear")
      .where("application.student.id = :studentId", { studentId })
      .andWhere("programYear.active = true")
      .andWhere("application.id = :applicationId", {
        applicationId,
      });
    return query.getOne();
  }

  /**
   * Creates a new Student Application to maintain history,
   * overriding the current one in order to rollback the
   * process and start the assessment all over again.
   * @param locationId location id executing the COE rollback.
   * @param applicationId application to be rolled back.
   * @returns the overridden and the newly created application.
   */
  async overrideApplicationForCOE(
    locationId: number,
    applicationId: number,
  ): Promise<ApplicationOverriddenResult> {
    const appToOverride = await this.repo.findOne(
      {
        id: applicationId,
        location: { id: locationId },
      },
      { relations: ["studentFiles"] },
    );

    if (!appToOverride) {
      throw new CustomNamedError(
        "Student Application not found or the location does not have access to it",
        APPLICATION_NOT_FOUND,
      );
    }

    if (
      appToOverride.applicationStatus !== ApplicationStatus.enrollment ||
      appToOverride.coeStatus !== COEStatus.required
    ) {
      throw new CustomNamedError(
        `Student Application is not in the expected status. The application must be in application status '${ApplicationStatus.enrollment}' and COE status '${COEStatus.required}' to be override.`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    // Change status of the current application being overwritten.
    appToOverride.applicationStatus = ApplicationStatus.overwritten;
    appToOverride.applicationStatusUpdatedOn = getUTCNow();

    // Create a new application record based off Overwritten
    // record to rollback state of application.
    const newApplication = new Application();
    newApplication.data = appToOverride.data;
    newApplication.applicationNumber = appToOverride.applicationNumber;
    newApplication.student = {
      id: appToOverride.studentId,
    } as Student;
    newApplication.location = {
      id: appToOverride.locationId,
    } as InstitutionLocation;
    if (appToOverride.pirProgramId) {
      newApplication.pirProgram = {
        id: appToOverride.pirProgramId,
      } as EducationProgram;
    }
    if (appToOverride.offeringId) {
      newApplication.offering = {
        id: appToOverride.offeringId,
      } as EducationProgramOffering;
    }
    newApplication.programYear = {
      id: appToOverride.programYearId,
    } as ProgramYear;
    newApplication.pirStatus = ProgramInfoStatus.required;
    newApplication.applicationStatus = ApplicationStatus.submitted;
    newApplication.applicationStatusUpdatedOn = getUTCNow();
    newApplication.studentFiles = appToOverride.studentFiles.map(
      (applicationFile: ApplicationStudentFile) => {
        // Recreate file associations for new application.
        const fileAssociation = new ApplicationStudentFile();
        fileAssociation.studentFile = {
          id: applicationFile.studentFileId,
        } as StudentFile;
        return fileAssociation;
      },
    );

    await this.repo.save([appToOverride, newApplication]);

    return {
      overriddenApplication: appToOverride,
      createdApplication: newApplication,
    };
  }

  /**
   * Starts an application assessment workflow associating
   * the created workflow with the Student Application.
   * @param applicationId Student Application to have the
   * workflow started.
   */
  async startApplicationAssessment(applicationId: number) {
    const application = await this.repo.findOneOrFail(applicationId);
    if (!application) {
      throw new CustomNamedError(
        "Student Application not found.",
        APPLICATION_NOT_FOUND,
      );
    }

    if (application.applicationStatus !== ApplicationStatus.submitted) {
      throw new CustomNamedError(
        `Student Application must be in ${ApplicationStatus.submitted} status to start the assessment workflow.`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    const assessmentWorkflow = await this.workflow.startApplicationAssessment(
      application.data.workflowName,
      application.id,
    );

    const workflowAssociationResult = await this.associateAssessmentWorkflow(
      application.id,
      assessmentWorkflow.id,
    );

    // 1 means the number of affected rows expected while
    // associating the workflow id.
    if (workflowAssociationResult.affected !== 1) {
      throw new Error("Error while associating the assessment workflow.");
    }
  }
  /**
   * Gets Application details for COE of a location
   * For COE, The source of truth is
   * offering table (not the data given by student)
   * @param locationId location id.
   * @param applicationId application id.
   * @returns application details for COE.
   */
  async getApplicationDetailsForCOE(
    locationId: number,
    applicationId: number,
    requiredCOEApplication: boolean = false,
  ): Promise<Application> {
    let query = this.repo
      .createQueryBuilder("application")
      .innerJoinAndSelect("application.location", "location")
      .innerJoinAndSelect("application.student", "student")
      .innerJoinAndSelect("student.user", "user")
      .innerJoinAndSelect("application.offering", "offering")
      .innerJoinAndSelect("offering.educationProgram", "educationProgram")
      .where("application.location.id = :locationId", { locationId })
      .andWhere("application.applicationStatus != :applicationStatus", {
        applicationStatus: ApplicationStatus.overwritten,
      })
      .andWhere("application.id = :applicationId", {
        applicationId,
      });
    if (!requiredCOEApplication) {
      query.andWhere("application.coeStatus != :nonCOEStatus", {
        nonCOEStatus: COEStatus.notRequired,
      });
    } else {
      query.andWhere("application.coeStatus = :COEStatus", {
        COEStatus: COEStatus.required,
      });
    }
    return query.getOne();
  }
}
