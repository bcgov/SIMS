import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  DataSource,
  In,
  Not,
  UpdateResult,
  Brackets,
  FindOneOptions,
} from "typeorm";
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
  ProgramYear,
  PIRDeniedReason,
  MSFAANumber,
  OfferingIntensity,
  StudentAssessment,
  AssessmentTriggerType,
  User,
  ApplicationData,
} from "../../database/entities";
import { SequenceControlService } from "../../services/sequence-control/sequence-control.service";
import { StudentFileService } from "../student-file/student-file.service";
import {
  ApplicationScholasticStandingStatus as ApplicationScholasticStandingStatus,
  ApplicationSubmissionResult,
} from "./application.models";
import { WorkflowActionsService } from "../workflow/workflow-actions.service";
import { MSFAANumberService } from "../msfaa-number/msfaa-number.service";
import {
  CustomNamedError,
  dateDifference,
  COE_WINDOW,
  PIR_DENIED_REASON_OTHER_ID,
  sortApplicationsColumnMap,
  PIR_OR_DATE_OVERLAP_ERROR_MESSAGE,
  PIR_OR_DATE_OVERLAP_ERROR,
  PaginationOptions,
  PaginatedResults,
  FieldSortOrder,
  OrderByCondition,
} from "../../utilities";
import { SFASApplicationService } from "../sfas/sfas-application.service";
import { SFASPartTimeApplicationsService } from "../sfas/sfas-part-time-application.service";
import { EducationProgramOfferingService } from "../education-program-offering/education-program-offering.service";
import { ConfigService } from "../config/config.service";
import { IConfig } from "../../types";
import { StudentRestrictionService } from "../restriction/student-restriction.service";
import {
  PIR_DENIED_REASON_NOT_FOUND_ERROR,
  PIR_REQUEST_NOT_FOUND_ERROR,
  OFFERING_NOT_VALID,
} from "../../constants";

export const APPLICATION_DRAFT_NOT_FOUND = "APPLICATION_DRAFT_NOT_FOUND";
export const MORE_THAN_ONE_APPLICATION_DRAFT_ERROR =
  "ONLY_ONE_APPLICATION_DRAFT_PER_STUDENT_ALLOWED";
export const APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND";
export const APPLICATION_NOT_VALID = "APPLICATION_NOT_VALID";
export const INVALID_OPERATION_IN_THE_CURRENT_STATUS =
  "INVALID_OPERATION_IN_THE_CURRENT_STATUS";
export const COE_DENIED_REASON_NOT_FOUND_ERROR =
  "COE_DENIED_REASON_NOT_FOUND_ERROR";
export const INSUFFICIENT_APPLICATION_SEARCH_PARAMS =
  "INSUFFICIENT_APPLICATION_SEARCH_PARAMS";

@Injectable()
export class ApplicationService extends RecordDataModelService<Application> {
  @InjectLogger()
  logger: LoggerService;
  private readonly config: IConfig;
  constructor(
    configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly sfasApplicationService: SFASApplicationService,
    private readonly sfasPartTimeApplicationsService: SFASPartTimeApplicationsService,
    private readonly sequenceService: SequenceControlService,
    private readonly fileService: StudentFileService,
    private readonly workflow: WorkflowActionsService,
    private readonly msfaaNumberService: MSFAANumberService,
    private readonly studentRestrictionService: StudentRestrictionService,
    private readonly offeringService: EducationProgramOfferingService,
  ) {
    super(dataSource.getRepository(Application));
    this.config = configService.getConfig();
    this.logger.log("[Created]");
  }

  /**
   * Submits a Student Application.
   * If the application is already in Draft state, then on submit the, existing
   * row will be updated with the payload and application status will be set to
   * Submitted and applicationStatusUpdatedOn will also be update and new workflow is started.
   * If a student submit/re-submit and an existing application that is not in draft state
   * (i.e existing application should be in any one of these status, submitted, In Progress,
   * Assessment, Enrollment), then the existing application status is set to `Overwritten` and
   * applicationStatusUpdatedOn is updated and delete the corresponding workflow and creates a
   * new Application with same Application Number and Program Year as that of the Overwritten
   * Application and with newly submitted payload. And starts a new workflow for the newly created
   * Application.
   * a new application with status 'Submitted'
   * If the PIR is not required, then offering is assigned to the assessment on submission
   * and the applicant student is assessed for SIN restriction.
   * @param applicationId application id that must be updated to submitted.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param studentId student id for authorization validations.
   * @param programYearId program year associated with the submission.
   * @param applicationData dynamic data received from Form.IO form.
   * @param associatedFiles associated uploaded files.
   * @returns the updated application.
   */
  async submitApplication(
    applicationId: number,
    auditUserId: number,
    studentId: number,
    programYearId: number,
    applicationData: ApplicationData,
    associatedFiles: string[],
  ): Promise<ApplicationSubmissionResult> {
    const application = await this.getApplicationToSave(
      studentId,
      undefined,
      applicationId,
    );
    // If the application was not found it is because it does not belongs to the
    // student or it is not in draft, Submitted, In Progress, Assessment, Enrollment state.
    // Either way it will be invalid.
    if (!application) {
      throw new CustomNamedError(
        "Student Application not found or it is not in the correct status to be submitted.",
        APPLICATION_NOT_FOUND,
      );
    }
    // If the the existing application was created under a different program year than
    // the one being used to submit it, it is not valid.
    if (application.programYear.id !== programYearId) {
      throw new CustomNamedError(
        "Student Application program year is not the expected one.",
        APPLICATION_NOT_VALID,
      );
    }

    const now = new Date();
    const auditUser = { id: auditUserId } as User;
    const originalAssessment = new StudentAssessment();
    originalAssessment.triggerType = AssessmentTriggerType.OriginalAssessment;
    originalAssessment.submittedBy = auditUser;
    originalAssessment.submittedDate = now;
    originalAssessment.creator = auditUser;
    // Offering is assigned to the original assessment if the application is not
    // required for PIR.
    if (applicationData.selectedProgram && applicationData.selectedOffering) {
      const offering = await this.offeringService.getProgramOffering(
        applicationData.selectedLocation,
        applicationData.selectedProgram,
        applicationData.selectedOffering,
      );
      if (!offering) {
        throw new CustomNamedError(
          "Not able to find the offering associated with the program and location.",
          OFFERING_NOT_VALID,
        );
      }
      originalAssessment.offering = offering;
    }

    if (application.applicationStatus === ApplicationStatus.draft) {
      /**
       * Generate the application number with respect to the programYearPrefix.
       * This ensures that respective sequence is created in the sequence_controls table
       * for specific year 2021,2022 subsequently.
       */
      application.applicationNumber = await this.generateApplicationNumber(
        application.programYear.programYearPrefix,
      );
      application.data = applicationData;
      application.applicationStatus = ApplicationStatus.submitted;
      application.relationshipStatus = applicationData.relationshipStatus;
      application.studentNumber = applicationData.studentNumber;
      application.applicationStatusUpdatedOn = now;
      application.studentFiles = await this.getSyncedApplicationFiles(
        studentId,
        application.studentFiles,
        associatedFiles,
      );
      application.modifier = auditUser;
      application.updatedAt = now;
      application.studentAssessments = [originalAssessment];
      application.currentAssessment = originalAssessment;

      // When application and assessment are saved, assess for SIN restriction.
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager
          .getRepository(Application)
          .save(application);

        // If the offering will be set in the assessment check for possible SIN restrictions.
        if (originalAssessment.offering) {
          await this.studentRestrictionService.assessSINRestrictionForOfferingId(
            studentId,
            originalAssessment.offering.id,
            application.id,
            auditUserId,
            transactionalEntityManager,
          );
        }
      });
      return { application, createdAssessment: originalAssessment };
    }
    /**
     * If a student submit/re-submit and an existing application that is not in draft state,
     * (i.e existing application should be in any one of these status, submitted, In Progress,
     * Assessment, Enrollment) then the execution will come here, then the existing application
     * status is set to `Overwritten` and applicationStatusUpdatedOn is updated and delete the
     * corresponding workflow and creates a new Application with same Application Number and
     * Program Year as that of the Overwritten Application and with newly submitted payload.
     */

    // Updating existing Application status to override
    // and updating the ApplicationStatusUpdatedOn.
    application.applicationStatus = ApplicationStatus.overwritten;
    application.applicationStatusUpdatedOn = now;

    // Creating New Application with same Application Number and Program Year as
    // that of the Overwritten Application and with newly submitted payload with
    // application status submitted.

    const newApplication = new Application();
    newApplication.applicationNumber = application.applicationNumber;
    newApplication.relationshipStatus = applicationData.relationshipStatus;
    newApplication.studentNumber = applicationData.studentNumber;
    newApplication.programYear = application.programYear;
    newApplication.data = applicationData;
    newApplication.applicationStatus = ApplicationStatus.submitted;
    newApplication.applicationStatusUpdatedOn = now;
    newApplication.student = { id: application.studentId } as Student;
    newApplication.studentFiles = await this.getSyncedApplicationFiles(
      studentId,
      [],
      associatedFiles,
    );
    // While editing an application, a new application record is created and a new
    // assessment record is also created to be the used as a "current Assessment" record.
    // The application and the assessment records have a DB relationship and the
    // assessment record also has a second relationship to the application that
    // keeps its history. Due to this double relationships the application record
    // and the assessment cannot be create at the same moment what causes a
    // "cyclic dependency error" on Typeorm. Saving the application record and later
    // having it associated with the assessment solves the issue.
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const applicationRepository =
        transactionalEntityManager.getRepository(Application);
      await applicationRepository.save(newApplication);
      newApplication.creator = auditUser;
      newApplication.studentAssessments = [originalAssessment];
      newApplication.currentAssessment = originalAssessment;
      await applicationRepository.save([application, newApplication]);
    });
    // Deleting the existing workflow, if there is one.
    if (application.currentAssessment.assessmentWorkflowId) {
      await this.workflow.deleteApplicationAssessment(
        application.currentAssessment.assessmentWorkflowId,
      );
    }

    return { application, createdAssessment: originalAssessment };
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

    let nextApplicationSequence = NaN;
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
   * @param auditUserId user who is making the changes.
   * @param programYearId program year associated with the application draft.
   * @param applicationData dynamic data received from Form.IO form.
   * @param associatedFiles associated uploaded files.
   * @param [applicationId] application id used to execute validations.
   * @returns Student Application saved draft.
   */
  async saveDraftApplication(
    studentId: number,
    auditUserId: number,
    programYearId: number,
    applicationData: ApplicationData,
    associatedFiles: string[],
    applicationId?: number,
  ): Promise<Application> {
    let draftApplication = await this.getApplicationToSave(
      studentId,
      ApplicationStatus.draft,
    );
    // If an application id is provided it means that an update is supposed to happen,
    // so an application draft is expected to be find. If not found, thrown an error.
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
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    // If there is no draft application, create one
    // and initialize the necessary data.
    if (!draftApplication) {
      draftApplication = new Application();
      draftApplication.student = { id: studentId } as Student;
      draftApplication.programYear = { id: programYearId } as ProgramYear;
      draftApplication.applicationStatus = ApplicationStatus.draft;
      draftApplication.applicationStatusUpdatedOn = now;
      draftApplication.creator = auditUser;
      draftApplication.createdAt = now;
    } else {
      draftApplication.modifier = auditUser;
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

  /**
   * Gets the Program Information Requests (PIR) associated with the
   * application and the original assessment that contains the offering
   * to be completed or that was completed during the PIR process.
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
      .select([
        "application.applicationNumber",
        "application.pirStatus",
        "application.data",
        "application.pirDeniedOtherDesc",
        "location.name",
        "student.id",
        "student.birthDate",
        "user.id",
        "user.firstName",
        "user.lastName",
        "pirProgram.id",
        "pirProgram.name",
        "educationProgram.id",
        "offering.id",
        "offering.name",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.mandatoryFees",
        "offering.exceptionalExpenses",
        "offering.offeringDelivered",
        "offering.lacksStudyBreaks",
        "offering.offeringType",
        "offering.offeringIntensity",
        "PIRDeniedReason.reason",
        "PIRDeniedReason.id",
        "programYear.id",
        "programYear.active",
        "programYear.startDate",
        "programYear.endDate",
        "sinValidation.id",
        "sinValidation.sin",
        "studentAssessments.id",
        "studentAssessments.triggerType",
      ])
      .innerJoin("application.programYear", "programYear")
      .leftJoin("application.pirProgram", "pirProgram")
      .innerJoin("application.student", "student")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("application.location", "location")
      .innerJoin("application.studentAssessments", "studentAssessments")
      .leftJoin("studentAssessments.offering", "offering")
      .leftJoin("offering.educationProgram", "educationProgram")
      .innerJoin("student.user", "user")
      .leftJoin("application.pirDeniedReasonId", "PIRDeniedReason")
      .where("application.id = :applicationId", {
        applicationId,
      })
      .andWhere("location.id = :locationId", { locationId })
      .andWhere("studentAssessments.triggerType = :triggerType", {
        triggerType: AssessmentTriggerType.OriginalAssessment,
      })
      .andWhere("application.pirStatus != :pirStatus", {
        pirStatus: ProgramInfoStatus.notRequired,
      })
      .andWhere("application.applicationStatus != :overwrittenStatus", {
        overwrittenStatus: ApplicationStatus.overwritten,
      })
      .getOne();
  }
  /**
   * Fetches application by applicationId and userId (optional).
   * @param applicationId
   * @param userId
   * @returns
   */
  async getApplicationByIdAndUser(
    applicationId: number,
    userId?: number,
  ): Promise<Application> {
    const applicationQuery = this.repo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "application.data",
        "application.applicationStatus",
        "application.pirStatus",
        "application.applicationStatusUpdatedOn",
        "application.applicationNumber",
        "application.pirDeniedOtherDesc",
        "currentAssessment.id",
        "currentAssessment.assessmentWorkflowId",
        "currentAssessment.noaApprovalStatus",
        "offering.id",
        "offering.offeringIntensity",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "location.id",
        "location.name",
        "pirDeniedReasonId.id",
        "pirDeniedReasonId.reason",
        "programYear.id",
        "programYear.formName",
        "programYear.startDate",
        "programYear.endDate",
      ])
      .leftJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("currentAssessment.offering", "offering")
      .leftJoin("application.location", "location")
      .leftJoin("location.institution", "institution")
      .leftJoin("institution.institutionType", "institutionType")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("application.programYear", "programYear")
      .leftJoin("application.pirDeniedReasonId", "pirDeniedReasonId")
      .where("application.id = :applicationIdParam", {
        applicationIdParam: applicationId,
      })
      .andWhere("application.applicationStatus != :overwrittenStatus", {
        overwrittenStatus: ApplicationStatus.overwritten,
      });
    if (userId) {
      applicationQuery.andWhere("user.id = :userId", { userId });
    }
    return applicationQuery.getOne();
  }

  /**
   * Get all student applications.
   * @param studentId student id .
   * @returns student Application list.
   */
  async getAllStudentApplications(
    studentId: number,
    pagination: PaginationOptions,
  ): Promise<[Application[], number]> {
    const applicationQuery = this.repo
      .createQueryBuilder("application")
      .select([
        "application.applicationNumber",
        "application.id",
        "currentAssessment.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "application.applicationStatus",
      ])
      .leftJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("currentAssessment.offering", "offering")
      .where("application.student.id = :studentId", { studentId })
      .andWhere("application.applicationStatus != :overwrittenStatus", {
        overwrittenStatus: ApplicationStatus.overwritten,
      });

    // sorting
    if (
      pagination.sortField &&
      pagination.sortField !== "status" &&
      sortApplicationsColumnMap(pagination.sortField)
    ) {
      applicationQuery.orderBy(
        sortApplicationsColumnMap(pagination.sortField),
        pagination.sortOrder,
      );
    } else {
      applicationQuery.orderBy(
        // TODO:Further investigation needed as the CASE translation does not work in orderby queries.
        `CASE application.application_status
              WHEN '${ApplicationStatus.draft}' THEN 1
              WHEN '${ApplicationStatus.submitted}' THEN 2
              WHEN '${ApplicationStatus.inProgress}' THEN 3
              WHEN '${ApplicationStatus.assessment}' THEN 4
              WHEN '${ApplicationStatus.enrollment}' THEN 5
              WHEN '${ApplicationStatus.completed}' THEN 6
              WHEN '${ApplicationStatus.cancelled}' THEN 7
              ELSE 8
            END`,
        pagination.sortOrder,
      );
    }

    // pagination
    applicationQuery
      .limit(pagination.pageLimit)
      .offset(pagination.page * pagination.pageLimit);

    // result
    return applicationQuery.getManyAndCount();
  }

  /**
   * Gets a application with the data needed to process
   * the operations related to save/submitting an
   * Student Application.
   * @param studentId student id.
   * @param status status is an optional parameter. if status
   * is passed, then application will be return with passed
   * status, if nothing is passed, then application with status
   * other than completed, overwritten, cancelled will be passed.
   * @param [applicationId] application id, when possible.
   * @returns application with the data needed to process
   * the operations related to save/submitting.
   */
  private async getApplicationToSave(
    studentId: number,
    status?: ApplicationStatus,
    applicationId?: number,
  ): Promise<Application> {
    const query = this.repo
      .createQueryBuilder("application")
      .select([
        "application",
        "programYear.id",
        "programYear.programYearPrefix",
        "studentFiles",
        "studentFile.uniqueFileName",
        "currentAssessment.id",
        "currentAssessment.assessmentWorkflowId",
      ])
      .innerJoin("application.programYear", "programYear")
      .leftJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("application.studentFiles", "studentFiles")
      .leftJoin("studentFiles.studentFile", "studentFile")
      .where("application.student.id = :studentId", { studentId })
      .andWhere("programYear.active = true");
    if (status) {
      query.andWhere("application.applicationStatus = :status", {
        status,
      });
    } else {
      query.andWhere("application.applicationStatus NOT IN (:...status)", {
        status: [
          ApplicationStatus.completed,
          ApplicationStatus.overwritten,
          ApplicationStatus.cancelled,
        ],
      });
    }
    if (applicationId) {
      query.andWhere("application.id = :applicationId", {
        applicationId,
      });
    }
    return query.getOne();
  }

  /**
   * Set the offering for Program Info Request (PIR).
   * Updates only applications that have the PIR status as required.
   * @param applicationId application id to be updated.
   * @param locationId location that is setting the offering.
   * @param offeringId offering to be set in the assessment.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @returns updated application.
   */
  async setOfferingForProgramInfoRequest(
    applicationId: number,
    locationId: number,
    offeringId: number,
    auditUserId: number,
  ): Promise<Application> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const applicationRepo =
        transactionalEntityManager.getRepository(Application);
      const application = await applicationRepo
        .createQueryBuilder("application")
        .select([
          "application.id",
          "currentAssessment.id",
          "student.id",
          "currentAssessment.assessmentWorkflowId",
        ])
        .innerJoin("application.currentAssessment", "currentAssessment")
        .innerJoin("application.student", "student")
        .where("application.id = :applicationId", { applicationId })
        .andWhere("application.location.id = :locationId", { locationId })
        .andWhere("application.applicationStatus != :applicationStatus", {
          applicationStatus: ApplicationStatus.overwritten,
        })
        .andWhere("application.pirStatus = :pirStatus", {
          pirStatus: ProgramInfoStatus.required,
        })
        .getOne();

      if (!application) {
        throw new CustomNamedError(
          "Not able to find an application that requires a PIR to be completed.",
          PIR_REQUEST_NOT_FOUND_ERROR,
        );
      }
      const auditUser = { id: auditUserId } as User;
      const now = new Date();
      application.currentAssessment.offering = {
        id: offeringId,
      } as EducationProgramOffering;
      application.currentAssessment.modifier = auditUser;
      application.currentAssessment.updatedAt = now;
      application.pirStatus = ProgramInfoStatus.completed;
      application.modifier = auditUser;
      application.updatedAt = now;
      await this.studentRestrictionService.assessSINRestrictionForOfferingId(
        application.student.id,
        offeringId,
        applicationId,
        auditUserId,
        transactionalEntityManager,
      );
      return applicationRepo.save(application);
    });
  }

  /**
   * Get all active applications of an institution location
   * with application status completed and respective archive status.
   * @param locationId location id .
   * @param paginationOptions options to execute the pagination.
   * @param archived archive status of applications requested by user.
   * @returns Student Active Application list.
   */
  async getActiveApplications(
    locationId: number,
    paginationOptions: PaginationOptions,
    archived: boolean,
  ): Promise<PaginatedResults<Application>> {
    // TODO: there are two similar methods to get one and many records for the same list/details getActiveApplication and getActiveApplications. Can we use only one?
    const activeApplicationQuery = this.repo
      .createQueryBuilder("application")
      .select([
        "application.applicationNumber",
        "application.id",
        "currentAssessment.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "student.id",
        "user.firstName",
        "user.lastName",
        "application.isArchived",
        "studentScholasticStanding.id",
      ])
      .leftJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("currentAssessment.offering", "offering")
      .leftJoin(
        "currentAssessment.studentScholasticStanding",
        "studentScholasticStanding",
      )
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("application.location.id = :locationId", { locationId })
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.completed,
      })
      .andWhere("application.isArchived = :isArchived", {
        isArchived: archived,
      });

    if (paginationOptions.searchCriteria) {
      activeApplicationQuery
        .andWhere(
          new Brackets((qb) => {
            qb.where(
              "CONCAT(user.firstName,' ', user.lastName) Ilike :searchCriteria",
            ).orWhere("application.applicationNumber Ilike :searchCriteria");
          }),
        )
        .setParameter(
          "searchCriteria",
          `%${paginationOptions.searchCriteria.trim()}%`,
        );
    }

    activeApplicationQuery
      .orderBy(
        this.transformToEntitySortField(
          paginationOptions.sortField,
          paginationOptions.sortOrder,
        ),
      )
      .offset(paginationOptions.page * paginationOptions.pageLimit)
      .limit(paginationOptions.pageLimit);

    const [result, count] = await activeApplicationQuery.getManyAndCount();
    return {
      results: result,
      count: count,
    };
  }

  /**
   * Returns application status with respect to archive status and scholastic standing change.
   * @param isArchived archive status.
   * @param studentScholasticStandingId scholastic standing id.
   * @returns application scholastic standing status.
   */
  getApplicationScholasticStandingStatus(
    isArchived: boolean,
    studentScholasticStandingId?: number,
  ): ApplicationScholasticStandingStatus {
    if (studentScholasticStandingId) {
      return ApplicationScholasticStandingStatus.Completed;
    }
    if (isArchived) {
      return ApplicationScholasticStandingStatus.Unavailable;
    }
    return ApplicationScholasticStandingStatus.Available;
  }

  /**
   * Transformation to convert the data table column name to database column name.
   * Any changes to the data object (e.g data table) in presentation layer must be adjusted here.
   * @param sortField database fields to be sorted.
   * @param sortOrder sort order of fields (Ascending or Descending order).
   * @returns OrderByCondition
   */
  private transformToEntitySortField(
    sortField = "applicationNumber",
    sortOrder = FieldSortOrder.ASC,
  ): OrderByCondition {
    const orderByCondition = {};
    if (sortField === "fullName") {
      orderByCondition["user.firstName"] = sortOrder;
      orderByCondition["user.lastName"] = sortOrder;
      return orderByCondition;
    }

    const fieldSortOptions = {
      applicationNumber: "application.applicationNumber",
    };
    const dbColumnName = fieldSortOptions[sortField];
    orderByCondition[dbColumnName] = sortOrder;
    return orderByCondition;
  }

  /**
   * Get applications of an institution location
   * with PIR status required and completed.
   * @param locationId location id .
   * @returns student Application list.
   */
  async getPIRApplications(locationId: number): Promise<Application[]> {
    return (
      this.repo
        .createQueryBuilder("application")
        .select([
          "application.applicationNumber",
          "application.id",
          "application.pirStatus",
          "currentAssessment.id",
          "offering.studyStartDate",
          "offering.studyEndDate",
          "student",
        ])
        .leftJoin("application.currentAssessment", "currentAssessment")
        .leftJoin("currentAssessment.offering", "offering")
        .innerJoin("application.student", "student")
        .innerJoinAndSelect("student.user", "user")
        .where("application.location.id = :locationId", { locationId })
        .andWhere("application.pirStatus is not null")
        .andWhere("application.pirStatus != :nonPirStatus", {
          nonPirStatus: ProgramInfoStatus.notRequired,
        })
        .andWhere("application.applicationStatus != :overwrittenStatus", {
          overwrittenStatus: ApplicationStatus.overwritten,
        })
        // TODO:Further investigation needed as the CASE translation does not work in orderby queries.
        .orderBy(
          `CASE application.pir_status
            WHEN '${ProgramInfoStatus.required}' THEN 1
            WHEN '${ProgramInfoStatus.submitted}' THEN 2
            WHEN '${ProgramInfoStatus.completed}' THEN 3
            WHEN '${ProgramInfoStatus.declined}' THEN 4
            ELSE 5
          END`,
        )
        .addOrderBy("application.applicationNumber")
        .getMany()
    );
  }
  /**
   * Update Student Application status.
   * Only allows the update on applications that are not in a final status.
   * The final statuses of an application are Completed, Overwritten and Cancelled.
   * @param applicationId application id.
   * @param applicationStatus application status that need to be updated.
   * @param auditUserId user who is making the changes.
   * @returns student Application UpdateResult.
   */
  async updateApplicationStatus(
    applicationId: number,
    applicationStatus: ApplicationStatus,
    auditUserId: number,
  ): Promise<UpdateResult> {
    const now = new Date();
    return this.repo.update(
      {
        id: applicationId,
        applicationStatus: Not(
          In([
            ApplicationStatus.completed,
            ApplicationStatus.overwritten,
            ApplicationStatus.cancelled,
          ]),
        ),
      },
      {
        applicationStatus: applicationStatus,
        applicationStatusUpdatedOn: now,
        modifier: { id: auditUserId } as User,
        updatedAt: now,
      },
    );
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
    includeInActivePY?: boolean,
  ): Promise<Application> {
    const query = this.repo
      .createQueryBuilder("application")
      .innerJoinAndSelect("application.programYear", "programYear")
      .where("application.student.id = :studentId", { studentId })
      .andWhere("application.id = :applicationId", {
        applicationId,
      });
    if (!includeInActivePY) {
      query.andWhere("programYear.active = true");
    }
    return query.getOne();
  }

  /**
   * Deny the Program Info Request (PIR) for an Application.
   * Updates only applications that have the PIR status as required.
   * @param applicationId application id to be updated.
   * @param locationId location that is setting the offering.
   * @param pirDeniedReasonId Denied reason id for a student application.
   * @param auditUserId user who is making the changes.
   * @param otherReasonDesc when other is selected as a PIR denied reason, text for the reason
   * is populated.
   * @returns updated application.
   */
  async setDeniedReasonForProgramInfoRequest(
    applicationId: number,
    locationId: number,
    pirDeniedReasonId: number,
    auditUserId: number,
    otherReasonDesc?: string,
  ): Promise<Application> {
    const application = await this.repo
      .createQueryBuilder("application")
      .select(["application.id", "currentAssessment.assessmentWorkflowId"])
      .innerJoin("application.currentAssessment", "currentAssessment")
      .where("application.id = :applicationId", { applicationId })
      .andWhere("application.location.id = :locationId", { locationId })
      .andWhere("application.applicationStatus != :applicationStatus", {
        applicationStatus: ApplicationStatus.overwritten,
      })
      .andWhere("application.pirStatus = :pirStatus", {
        pirStatus: ProgramInfoStatus.required,
      })
      .getOne();

    if (!application) {
      throw new CustomNamedError(
        "Not able to find an application that requires a PIR to be completed.",
        PIR_REQUEST_NOT_FOUND_ERROR,
      );
    }

    application.pirDeniedReasonId = {
      id: pirDeniedReasonId,
    } as PIRDeniedReason;
    if (PIR_DENIED_REASON_OTHER_ID === pirDeniedReasonId && !otherReasonDesc) {
      throw new CustomNamedError(
        "Other is selected as PIR reason, specify the reason for the PIR denial.",
        PIR_DENIED_REASON_NOT_FOUND_ERROR,
      );
    }
    application.pirDeniedOtherDesc = otherReasonDesc;
    application.pirStatus = ProgramInfoStatus.declined;
    application.modifier = { id: auditUserId } as User;
    return this.repo.save(application);
  }

  /**
   * Checks if the confirmation of enrollment can be executed in the present date.
   * Institutions can execute confirmation of enrollments not before 21 days of the offering start date.
   * After the offering start date institutions can still execute the CoE.
   * @param offeringStartDate offering start date.
   * @returns true if the confirmation of enrollment can happen, otherwise false.
   */
  withinValidCOEWindow(offeringStartDate: Date): boolean {
    return dateDifference(new Date(), offeringStartDate) <= COE_WINDOW;
  }

  /**
   * Associates an MSFAA number to the application checking
   * whatever is needed to create a new MSFAA or use an
   * existing one instead.
   * @param applicationId application id to receive an MSFAA.
   */
  async associateMSFAANumber(applicationId: number): Promise<Application> {
    const application = await this.repo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "application.applicationStatus",
        "student.id",
        "currentAssessment.id",
        "offering.id",
        "offering.offeringIntensity",
      ])
      .innerJoin("application.student", "student")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .where("application.id =:applicationId", { applicationId })
      .getOne();

    if (!application) {
      throw new CustomNamedError(
        "Student Application not found or one of its associations is missing.",
        APPLICATION_NOT_FOUND,
      );
    }

    if (application.applicationStatus !== ApplicationStatus.assessment) {
      throw new CustomNamedError(
        `Student Application is not in the expected status. The application must be in application status '${ApplicationStatus.assessment}' for an MSFAA number be assigned.`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    let msfaaNumberId: number;

    // Checks if there is an MSFAA that could be considered valid.
    const existingValidMSFAANumber =
      await this.msfaaNumberService.getCurrentValidMSFAANumber(
        application.student.id,
        application.currentAssessment.offering.offeringIntensity,
      );
    if (existingValidMSFAANumber) {
      // Reuse the MSFAA that is still valid and avoid creating a new one.
      msfaaNumberId = existingValidMSFAANumber.id;
    } else {
      // Get previously completed and signed application for the student
      // to determine if an existing MSFAA is still valid.
      const previousSignedApplication =
        await this.getPreviouslySignedApplication(
          application.student.id,
          application.currentAssessment.offering.offeringIntensity,
        );

      let hasValidMSFAANumber = false;
      if (previousSignedApplication) {
        const [originalAssessment] =
          previousSignedApplication.studentAssessments;
        // checks if the MSFAA number is still valid.
        hasValidMSFAANumber = this.msfaaNumberService.isMSFAANumberValid(
          // Previously signed and completed application offering end date in considered the start date.
          originalAssessment.offering.studyEndDate,
          // Start date of the offering of the current application is considered the end date.
          originalAssessment.offering.studyStartDate,
        );
      }

      if (hasValidMSFAANumber) {
        // Reuse the MSFAA number.
        msfaaNumberId = previousSignedApplication.msfaaNumber.id;
      } else {
        // Create a new MSFAA number case the previous one is no longer valid.
        const newMSFAANumber = await this.msfaaNumberService.createMSFAANumber(
          application.student.id,
          applicationId,
          application.currentAssessment.offering.offeringIntensity,
        );
        msfaaNumberId = newMSFAANumber.id;
      }
    }

    // Associate the MSFAA number with the application.
    application.msfaaNumber = { id: msfaaNumberId } as MSFAANumber;

    return this.repo.save(application);
  }

  /**
   * Gets the application that has an MSFAA signed date.
   * @param studentId student id to filter the applications.
   * @param offeringIntensity MSFAA are generated individually for full-time/part-time
   * applications. The offering intensity is used to differentiate between them.
   * @returns previous signed application if exists, otherwise null.
   */
  async getPreviouslySignedApplication(
    studentId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<Application> {
    return this.repo
      .createQueryBuilder("applications")
      .select(["applications.id", "msfaaNumbers.id", "offerings.studyEndDate"])
      .innerJoin("applications.studentAssessments", "assessment")
      .innerJoin("assessment.offering", "offerings")
      .innerJoin("applications.msfaaNumber", "msfaaNumbers")
      .innerJoin("applications.student", "students")
      .where("applications.applicationStatus = :completedStatus", {
        completedStatus: ApplicationStatus.completed,
      })
      .andWhere("assessment.triggerType = :triggerType", {
        triggerType: AssessmentTriggerType.OriginalAssessment,
      })
      .andWhere("students.id = :studentId", { studentId })
      .andWhere("msfaaNumbers.dateSigned is not null")
      .andWhere("msfaaNumbers.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .orderBy("offerings.studyEndDate", "DESC")
      .limit(1)
      .getOne();
  }

  /**
   * Gets active application - Active application are applications
   * with coe status completed and application status completed.
   * @param applicationId application id.
   * @param locationId location id.
   * @returns active application details.
   */
  async getActiveApplication(
    applicationId: number,
    locationId: number,
  ): Promise<Application> {
    // TODO: there are two similar methods to get one and many records for the same list/details getActiveApplication and getActiveApplications. Can we use only one?
    return this.repo
      .createQueryBuilder("application")
      .select([
        "application.applicationStatus",
        "application.applicationNumber",
        "currentAssessment.id",
        "offering.offeringIntensity",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "educationProgram.name",
        "educationProgram.description",
        "location.name",
        "offering.name",
        "student",
        "user.firstName",
        "user.lastName",
        "educationProgram.credentialType",
        "educationProgram.deliveredOnline",
        "educationProgram.deliveredOnSite",
        "offering.offeringDelivered",
        "offering.studyBreaks",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.mandatoryFees",
        "offering.exceptionalExpenses",
      ])
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("offering.institutionLocation", "location")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("application.id = :applicationId", { applicationId })
      .andWhere("location.id = :locationId", { locationId })
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.completed,
      })
      .getOne();
  }

  /**
   * When a supporting user (e.g. parent/partner) need to provide
   * supporting data for a Student Application, this method provides
   * a way to find the specific application to be updated using the
   * right amount of criteria as per defined in the Ministry Policies.
   * @param applicationNumber application number provided.
   * @param lastName last name of the student associated with the
   * application (search will be case insensitive).
   * @param birthDate birth date of the student associated with the
   * application.
   * @returns application the application that was found, otherwise null.
   */
  async getApplicationForSupportingUser(
    applicationNumber: string,
    lastName: string,
    birthDate: Date,
  ): Promise<Application> {
    return this.repo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "programYear.parentFormName",
        "programYear.partnerFormName",
        "programYear.startDate",
        "user.userName",
        "student.id",
      ])
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("application.programYear", "programYear")
      .where("application.applicationNumber = :applicationNumber", {
        applicationNumber,
      })
      .andWhere("lower(user.lastName) = lower(:lastName)", { lastName })
      .andWhere("student.birthDate = :birthDate", { birthDate })
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.inProgress,
      })
      .getOne();
  }

  /**
   * Validates to make sure that a student cannot create more than one application with overlapping study period dates.
   * When an application is pending for PIR approval then study period dates are subjective. In this case another application
   * is not allowed to be created because on PIR approval the study period dates may overlap with an existing application.
   * @param userId user to be verified.
   * @param studyStartDate offering start date.
   * @param studyEndDate offering start date.
   * @param currentApplicationId current application that should be skipped during this verification.
   * @returns Overlapping or PIR pending Application.
   */
  async validatePIRAndDateOverlap(
    userId: number,
    studyStartDate: Date,
    studyEndDate: Date,
    currentApplicationId: number,
  ): Promise<Application> {
    return this.repo
      .createQueryBuilder("application")
      .select(["application.id"])
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("user.id = :userId", { userId })
      .andWhere("application.id != :currentApplicationId", {
        currentApplicationId,
      })
      .andWhere("application.applicationStatus NOT IN (:...status)", {
        status: [
          ApplicationStatus.draft,
          ApplicationStatus.overwritten,
          ApplicationStatus.cancelled,
        ],
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("offering.id is NULL")
            .orWhere(
              "offering.studyStartDate BETWEEN :studyStartDate AND :studyEndDate",
              { studyStartDate: studyStartDate, studyEndDate: studyEndDate },
            )
            .orWhere(
              "offering.studyEndDate BETWEEN :studyStartDate AND :studyEndDate",
              { studyStartDate: studyStartDate, studyEndDate: studyEndDate },
            )
            .orWhere(
              " :studyStartDate BETWEEN offering.studyStartDate AND offering.studyEndDate",
              { studyStartDate: studyStartDate },
            )
            .orWhere(
              " :studyEndDate BETWEEN offering.studyStartDate AND offering.studyEndDate",
              { studyEndDate: studyEndDate },
            );
        }),
      )
      .getOne();
  }

  async doesApplicationExist(
    applicationNumber: string,
    studentId: number,
  ): Promise<boolean> {
    return !!(await this.repo.findOne({
      where: {
        applicationNumber: applicationNumber,
        student: { id: studentId } as Student,
      },
      select: { id: true },
    }));
  }

  /**
   * Retrieve application with application number in
   * completed status.
   ** Application id is used to perform same lookup by id
   ** instead of application number.
   * @param userId
   * @param applicationId
   * @param applicationNumber
   * @returns
   */
  async getApplicationToRequestAppeal(
    userId: number,
    applicationNumber?: string,
    applicationId?: number,
  ): Promise<Application> {
    const findQuery: FindOneOptions<Application> = {
      select: {
        id: true,
        applicationNumber: true,
        isArchived: true,
      },
      where: {
        student: { user: { id: userId } },
        applicationStatus: ApplicationStatus.completed,
      },
    };
    if (applicationId) {
      findQuery.where = {
        ...findQuery.where,
        applicationNumber: applicationNumber,
      };
    }
    return this.repo.findOne(findQuery);
  }

  /**
   * Validation for application overlapping dates or Pending PIR.
   * This validation can be disabled by setting BYPASS_APPLICATION_SUBMIT_VALIDATIONS to true in .env file.
   * @param applicationId
   * @param lastName
   * @param userId
   * @param sin
   * @param birthDate
   * @param studyStartDate
   * @param studyEndDate
   */
  async validateOverlappingDatesAndPIR(
    applicationId: number,
    lastName: string,
    userId: number,
    sin: string,
    birthDate: Date,
    studyStartDate: Date,
    studyEndDate: Date,
  ): Promise<void> {
    if (!this.config.bypassApplicationSubmitValidations) {
      const existingOverlapApplication = this.validatePIRAndDateOverlap(
        userId,
        studyStartDate,
        studyEndDate,
        applicationId,
      );

      const existingSFASFTApplication =
        this.sfasApplicationService.validateDateOverlap(
          sin,
          birthDate,
          lastName,
          studyStartDate,
          studyEndDate,
        );

      const existingSFASPTApplication =
        this.sfasPartTimeApplicationsService.validateDateOverlap(
          sin,
          birthDate,
          lastName,
          studyStartDate,
          studyEndDate,
        );
      const [
        applicationResponse,
        sfasFTApplicationResponse,
        sfasPTApplicationResponse,
      ] = await Promise.all([
        existingOverlapApplication,
        existingSFASFTApplication,
        existingSFASPTApplication,
      ]);
      if (
        !!applicationResponse ||
        !!sfasFTApplicationResponse ||
        !!sfasPTApplicationResponse
      ) {
        throw new CustomNamedError(
          PIR_OR_DATE_OVERLAP_ERROR_MESSAGE,
          PIR_OR_DATE_OVERLAP_ERROR,
        );
      }
    }
  }

  /**
   * Archives one or more applications when 43 days
   * have passed the end of the study period.
   * @param auditUserId user making changes to table.
   */
  async archiveApplications(auditUserId: number): Promise<void> {
    const auditUser = { id: auditUserId } as User;

    // Build sql statement to get all application ids to archive
    const applicationsToArchive = this.repo
      .createQueryBuilder("application")
      .select("application.id")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .where("application.applicationStatus = :completed")
      .andWhere(
        "(CURRENT_DATE - offering.studyEndDate) > :applicationArchiveDays",
      )
      .andWhere("application.isArchived <> :isApplicationArchived")
      .getSql();

    await this.repo
      .createQueryBuilder()
      .update(Application)
      .set({ isArchived: true, modifier: auditUser })
      .where(`applications.id IN (${applicationsToArchive})`)
      .setParameter("completed", ApplicationStatus.completed)
      .setParameter(
        "applicationArchiveDays",
        this.config.applicationArchiveDays,
      )
      .setParameter("isApplicationArchived", true)
      .execute();
  }
}
