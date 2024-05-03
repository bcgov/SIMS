import { Injectable } from "@nestjs/common";
import { DataSource, In, Not, Brackets, EntityManager } from "typeorm";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  RecordDataModelService,
  Application,
  ApplicationStudentFile,
  EducationProgramOffering,
  ProgramInfoStatus,
  ApplicationStatus,
  Student,
  StudentFile,
  ProgramYear,
  PIRDeniedReason,
  StudentAssessment,
  AssessmentTriggerType,
  User,
  ApplicationData,
  getUserFullNameLikeSearch,
  transformToApplicationEntitySortField,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { StudentFileService } from "../student-file/student-file.service";
import {
  ApplicationScholasticStandingStatus as ApplicationScholasticStandingStatus,
  ApplicationSubmissionResult,
} from "./application.models";
import {
  PIR_DENIED_REASON_OTHER_ID,
  sortApplicationsColumnMap,
  STUDY_DATE_OVERLAP_ERROR_MESSAGE,
  STUDY_DATE_OVERLAP_ERROR,
  PaginationOptions,
  PaginatedResults,
  offeringBelongToProgramYear,
  APPLICATION_EDIT_COUNT_TO_SEND_NOTIFICATION,
} from "../../utilities";
import { CustomNamedError } from "@sims/utilities";
import {
  SFASApplicationService,
  SFASPartTimeApplicationsService,
} from "@sims/services/sfas";
import { EducationProgramOfferingService } from "../education-program-offering/education-program-offering.service";
import { StudentRestrictionService } from "../restriction/student-restriction.service";
import {
  PIR_DENIED_REASON_NOT_FOUND_ERROR,
  PIR_REQUEST_NOT_FOUND_ERROR,
  OFFERING_NOT_VALID,
  INSTITUTION_LOCATION_NOT_VALID,
  OFFERING_INTENSITY_MISMATCH,
  OFFERING_DOES_NOT_BELONG_TO_LOCATION,
  OFFERING_PROGRAM_YEAR_MISMATCH,
  EDUCATION_PROGRAM_IS_NOT_ACTIVE,
} from "../../constants";
import { SequenceControlService } from "@sims/services";
import { ConfigService } from "@sims/utilities/config";
import {
  ApplicationEditedTooManyTimesNotification,
  NotificationActionsService,
  NotificationService,
} from "@sims/services/notifications";
import { InstitutionLocationService } from "../institution-location/institution-location.service";
import { EducationProgramService, StudentService } from "..";

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
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly sfasApplicationService: SFASApplicationService,
    private readonly sfasPartTimeApplicationsService: SFASPartTimeApplicationsService,
    private readonly sequenceService: SequenceControlService,
    private readonly fileService: StudentFileService,
    private readonly studentRestrictionService: StudentRestrictionService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly educationProgramService: EducationProgramService,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly institutionLocationService: InstitutionLocationService,
    private readonly notificationService: NotificationService,
    private readonly studentService: StudentService,
  ) {
    super(dataSource.getRepository(Application));
  }

  /**
   * Submits a Student Application.
   * If the application is already in Draft state, then on submit the, existing
   * row will be updated with the payload and application status will be set to
   * Submitted and applicationStatusUpdatedOn will also be update and new workflow is started.
   * If a student submit/re-submit an existing application that is not in draft state
   * (i.e existing application should be in any one of these status, submitted, In Progress,
   * Assessment, Enrollment), then the existing application status is set to `Overwritten` and
   * applicationStatusUpdatedOn is updated and delete the corresponding workflow and creates a
   * new Application with same Application Number and Program Year as that of the Overwritten
   * Application and with newly submitted payload. And starts a new workflow for the newly created
   * Application. If the application is edited for the {@link APPLICATION_EDIT_COUNT_TO_SEND_NOTIFICATION} times,
   * a notification is saved for the ministry along with the edited application as a part of the same transaction.
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
    const institutionLocation =
      await this.institutionLocationService.getInstitutionLocation(
        applicationData.selectedLocation,
      );
    if (!institutionLocation) {
      throw new CustomNamedError(
        "Not able to find the institution location.",
        INSTITUTION_LOCATION_NOT_VALID,
      );
    }
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

    if (application.applicationStatus === ApplicationStatus.Draft) {
      /**
       * Generate the application number with respect to the programYearPrefix.
       * This ensures that respective sequence is created in the sequence_controls table
       * for specific year 2021,2022 subsequently.
       */
      application.applicationNumber = await this.generateApplicationNumber(
        application.programYear.programYearPrefix,
      );
      application.data = applicationData;
      application.applicationStatus = ApplicationStatus.Submitted;
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
      application.submittedDate = now;
      application.location = institutionLocation;

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
    application.applicationStatus = ApplicationStatus.Overwritten;
    application.applicationStatusUpdatedOn = now;

    // Creating New Application with same Application Number and Program Year as
    // that of the Overwritten Application and with newly submitted payload with
    // application status submitted.
    const newApplication = new Application();
    // Current date is set as submitted date.
    newApplication.submittedDate = now;
    newApplication.applicationNumber = application.applicationNumber;
    newApplication.relationshipStatus = applicationData.relationshipStatus;
    newApplication.studentNumber = applicationData.studentNumber;
    newApplication.programYear = application.programYear;
    newApplication.data = applicationData;
    newApplication.applicationStatus = ApplicationStatus.Submitted;
    newApplication.applicationStatusUpdatedOn = now;
    newApplication.student = { id: application.studentId } as Student;
    newApplication.studentFiles = await this.getSyncedApplicationFiles(
      studentId,
      [],
      associatedFiles,
    );
    newApplication.location = institutionLocation;
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

      // Updates the current assessment status to cancellation requested.
      application.currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.CancellationRequested;
      application.currentAssessment.modifier = auditUser;
      application.currentAssessment.studentAssessmentStatusUpdatedOn = now;
      application.currentAssessment.updatedAt = now;
      await applicationRepository.save([application, newApplication]);
      await this.saveApplicationEditedTooManyTimesNotification(
        newApplication.applicationNumber,
        application.studentId,
        transactionalEntityManager,
      );
    });
    return { application, createdAssessment: originalAssessment };
  }

  /**
   * Saves a notification when the application is edited too many times
   * governed by {@link APPLICATION_EDIT_COUNT_TO_SEND_NOTIFICATION}.
   * @param applicationNumber application number of the related application.
   * @param studentId related student id.
   * @param transactionalEntityManager entity manager to be a part of the transaction.
   */
  private async saveApplicationEditedTooManyTimesNotification(
    applicationNumber: string,
    studentId: number,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    const applicationRepository =
      transactionalEntityManager.getRepository(Application);
    const applicationsCount = await applicationRepository.count({
      where: { applicationNumber },
    });
    if (applicationsCount > APPLICATION_EDIT_COUNT_TO_SEND_NOTIFICATION) {
      const notificationExists =
        await this.notificationService.checkApplicationEditedTooManyTimesNotificationExists(
          transactionalEntityManager,
          applicationNumber,
        );
      if (!notificationExists) {
        const student = await this.studentService.getStudentById(studentId);
        const ministryNotification: ApplicationEditedTooManyTimesNotification =
          {
            givenNames: student.user.firstName,
            lastName: student.user.lastName,
            email: student.user.email,
            birthDate: student.birthDate,
            applicationNumber,
          };
        await this.notificationActionsService.saveApplicationEditedTooManyTimesNotification(
          ministryNotification,
          applicationNumber,
          transactionalEntityManager,
        );
      }
    }
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
      ApplicationStatus.Draft,
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
      draftApplication.applicationStatus = ApplicationStatus.Draft;
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
        "application.id",
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
        overwrittenStatus: ApplicationStatus.Overwritten,
      })
      .getOne();
  }

  /**
   * Gets a student application by applicationId.
   * Student id/ institution id can be provided for authorization purposes.
   * @param applicationId application id.
   * @param options object that should contain:
   * - `loadDynamicData` indicates if the dynamic data(JSONB) should be loaded.
   * - `studentId` student id.
   * - `institutionId` institution id.
   * @returns student application.
   */
  async getApplicationById(
    applicationId: number,
    options?: {
      loadDynamicData?: boolean;
      studentId?: number;
      institutionId?: number;
    },
  ): Promise<Application> {
    return this.repo.findOne({
      select: {
        id: true,
        data: !!options?.loadDynamicData as unknown,
        applicationStatus: true,
        pirStatus: true,
        applicationStatusUpdatedOn: true,
        applicationNumber: true,
        pirDeniedOtherDesc: true,
        submittedDate: true,
        applicationException: {
          id: true,
          exceptionStatus: true,
        },
        currentAssessment: {
          id: true,
          assessmentWorkflowId: true,
          noaApprovalStatus: true,
          offering: {
            id: true,
            offeringIntensity: true,
            studyStartDate: true,
            studyEndDate: true,
            offeringStatus: true,
          },
        },
        location: {
          id: true,
          name: true,
        },
        pirDeniedReasonId: {
          id: true,
          reason: true,
        },
        programYear: {
          id: true,
          formName: true,
          startDate: true,
          endDate: true,
        },
      },
      relations: {
        applicationException: true,
        currentAssessment: { offering: true },
        location: true,
        pirDeniedReasonId: true,
        programYear: true,
      },
      where: {
        id: applicationId,
        applicationStatus: Not(ApplicationStatus.Overwritten),
        student: {
          id: options?.studentId,
        },
        location: { institution: { id: options?.institutionId } },
      },
    });
  }

  /**
   * Get all student applications.
   * @param studentId student id.
   * @param pagination options to execute the pagination.
   * @param institutionId id of the institution that the student applied to.
   * @returns student Application list.
   */
  async getAllStudentApplications(
    studentId: number,
    pagination: PaginationOptions,
    institutionId?: number,
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
        overwrittenStatus: ApplicationStatus.Overwritten,
      });
    // If institution id is present, get only the applications
    // linked with the institution.

    if (institutionId) {
      applicationQuery
        .innerJoin("application.location", "institutionLocation")
        .innerJoin("institutionLocation.institution", "institution")
        .andWhere("institution.id = :institutionId", {
          institutionId,
        });
    }

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
              WHEN '${ApplicationStatus.Draft}' THEN 1
              WHEN '${ApplicationStatus.Submitted}' THEN 2
              WHEN '${ApplicationStatus.InProgress}' THEN 3
              WHEN '${ApplicationStatus.Assessment}' THEN 4
              WHEN '${ApplicationStatus.Enrolment}' THEN 5
              WHEN '${ApplicationStatus.Completed}' THEN 6
              WHEN '${ApplicationStatus.Cancelled}' THEN 7
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
          ApplicationStatus.Completed,
          ApplicationStatus.Overwritten,
          ApplicationStatus.Cancelled,
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
          "user.id",
          "user.firstName",
          "user.lastName",
          "user.email",
          "currentAssessment.assessmentWorkflowId",
        ])
        .innerJoin("application.currentAssessment", "currentAssessment")
        .innerJoin("application.student", "student")
        .innerJoin("student.user", "user")
        .where("application.id = :applicationId", { applicationId })
        .andWhere("application.location.id = :locationId", { locationId })
        .andWhere("application.applicationStatus != :applicationStatus", {
          applicationStatus: ApplicationStatus.Overwritten,
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

      const updatedApplication = await applicationRepo.save(application);

      // Create student notification when institution completes PIR.
      await this.notificationActionsService.saveInstitutionCompletePIRNotification(
        {
          givenNames: application.student.user.firstName,
          lastName: application.student.user.lastName,
          toAddress: application.student.user.email,
          userId: application.student.user.id,
        },
        auditUserId,
        transactionalEntityManager,
      );

      return updatedApplication;
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
        applicationStatus: ApplicationStatus.Completed,
      })
      .andWhere("application.isArchived = :isArchived", {
        isArchived: archived,
      });

    if (paginationOptions.searchCriteria) {
      activeApplicationQuery
        .andWhere(
          new Brackets((qb) => {
            qb.where(getUserFullNameLikeSearch()).orWhere(
              "application.applicationNumber Ilike :searchCriteria",
            );
          }),
        )
        .setParameter(
          "searchCriteria",
          `%${paginationOptions.searchCriteria.trim()}%`,
        );
    }

    activeApplicationQuery
      .orderBy(
        transformToApplicationEntitySortField(
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
          overwrittenStatus: ApplicationStatus.Overwritten,
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
   * Update Student Application status to cancelled.
   * Only allows the update on applications that are not in a final status.
   * The final statuses of an application are Completed, Overwritten and Cancelled.
   * @param applicationId application id.
   * @param studentId student id for authorization purposes.
   * @param auditUserId user who is making the changes.
   * @returns student application update result.
   */
  async cancelStudentApplication(
    applicationId: number,
    studentId: number,
    auditUserId: number,
  ): Promise<Application> {
    const application = await this.repo.findOne({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          assessmentWorkflowId: true,
        },
      },
      relations: {
        currentAssessment: true,
      },
      where: {
        id: applicationId,
        student: {
          id: studentId,
        },
        applicationStatus: Not(
          In([
            ApplicationStatus.Completed,
            ApplicationStatus.Overwritten,
            ApplicationStatus.Cancelled,
          ]),
        ),
      },
    });
    if (!application) {
      throw new CustomNamedError(
        "Application not found or it is not in the correct state to be cancelled.",
        APPLICATION_NOT_FOUND,
      );
    }
    // Updates the application status to cancelled.
    const now = new Date();
    const auditUser = { id: auditUserId } as User;
    application.applicationStatus = ApplicationStatus.Cancelled;
    application.applicationStatusUpdatedOn = now;
    application.modifier = auditUser;
    application.updatedAt = now;

    // Updates the current assessment status to cancellation requested if there is one. Applications with draft status do not have a current assessment.
    if (application.currentAssessment) {
      application.currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.CancellationRequested;
      application.currentAssessment.modifier = auditUser;
      application.currentAssessment.studentAssessmentStatusUpdatedOn = now;
      application.currentAssessment.updatedAt = now;
    }

    await this.repo.save(application);
    return application;
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
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const application = await transactionalEntityManager
        .getRepository(Application)
        .createQueryBuilder("application")
        .select([
          "application.id",
          "currentAssessment.id",
          "currentAssessment.assessmentWorkflowId",
          "student.id",
          "user.id",
          "user.firstName",
          "user.lastName",
          "user.email",
        ])
        .innerJoin("application.currentAssessment", "currentAssessment")
        .innerJoin("application.student", "student")
        .innerJoin("student.user", "user")
        .where("application.id = :applicationId", { applicationId })
        .andWhere("application.location.id = :locationId", { locationId })
        .andWhere("application.applicationStatus != :applicationStatus", {
          applicationStatus: ApplicationStatus.Overwritten,
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
      if (
        PIR_DENIED_REASON_OTHER_ID === pirDeniedReasonId &&
        !otherReasonDesc
      ) {
        throw new CustomNamedError(
          "Other is selected as PIR reason, specify the reason for the PIR denial.",
          PIR_DENIED_REASON_NOT_FOUND_ERROR,
        );
      }
      application.pirDeniedOtherDesc = otherReasonDesc;
      application.pirStatus = ProgramInfoStatus.declined;
      application.modifier = { id: auditUserId } as User;
      await transactionalEntityManager
        .getRepository(Application)
        .save(application);

      // Create student notification when institution completes PIR.
      await this.notificationActionsService.saveInstitutionCompletePIRNotification(
        {
          givenNames: application.student.user.firstName,
          lastName: application.student.user.lastName,
          toAddress: application.student.user.email,
          userId: application.student.user.id,
        },
        auditUserId,
        transactionalEntityManager,
      );
      return application;
    });
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
        applicationStatus: ApplicationStatus.Completed,
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
    birthDate: string,
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
        "application.data",
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
        applicationStatus: ApplicationStatus.InProgress,
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
    studyStartDate: string,
    studyEndDate: string,
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
          ApplicationStatus.Draft,
          ApplicationStatus.Overwritten,
          ApplicationStatus.Cancelled,
        ],
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("offering.id is NULL")
            .orWhere(
              "offering.studyStartDate BETWEEN :studyStartDate AND :studyEndDate",
              { studyStartDate, studyEndDate },
            )
            .orWhere(
              "offering.studyEndDate BETWEEN :studyStartDate AND :studyEndDate",
              { studyStartDate, studyEndDate },
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
        student: { id: studentId },
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
    return this.repo.findOne({
      select: {
        id: true,
        applicationNumber: true,
        isArchived: true,
        programYear: { id: true, programYear: true },
      },
      relations: { programYear: true },
      where: {
        student: { user: { id: userId } },
        applicationStatus: ApplicationStatus.Completed,
        applicationNumber,
        id: applicationId,
      },
    });
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
  async validateOverlappingDates(
    applicationId: number,
    lastName: string,
    userId: number,
    sin: string,
    birthDate: string,
    studyStartDate: string,
    studyEndDate: string,
  ): Promise<void> {
    if (!this.configService.bypassApplicationSubmitValidations) {
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
          STUDY_DATE_OVERLAP_ERROR_MESSAGE,
          STUDY_DATE_OVERLAP_ERROR,
        );
      }
    }
  }

  /**
   * Fetches application by applicationId and studentId.
   * @param applicationId application id.
   * @param studentId student id (optional parameter.).
   * @returns application details
   */
  async getApplicationDetails(
    applicationId: number,
    studentId?: number,
  ): Promise<Application> {
    return this.repo.findOne({
      select: {
        id: true,
        applicationStatus: true,
        applicationNumber: true,
        location: {
          id: true,
          name: true,
        },
        applicationStatusUpdatedOn: true,
        pirStatus: true,
        pirDeniedReasonId: {
          id: true,
          reason: true,
        },
        pirDeniedOtherDesc: true,
        currentAssessment: {
          id: true,
          offering: {
            id: true,
            offeringStatus: true,
            studyStartDate: true,
            studyEndDate: true,
            offeringIntensity: true,
          },
          disbursementSchedules: {
            id: true,
            coeStatus: true,
            disbursementDate: true,
            disbursementScheduleStatus: true,
          },
        },
        applicationException: {
          id: true,
          exceptionStatus: true,
        },
        submittedDate: true,
        // data is of type 'FindOptionsSelect<ApplicationData>'.
        // Here even if the data is spread the db will fetch all the data property as of now.
        data: {
          studyendDate: true,
          studystartDate: true,
          howWillYouBeAttendingTheProgram: true,
        },
        studentScholasticStandings: {
          id: true,
          changeType: true,
        },
      },
      relations: {
        pirDeniedReasonId: true,
        currentAssessment: { offering: true, disbursementSchedules: true },
        applicationException: true,
        location: true,
        studentScholasticStandings: true,
      },
      where: {
        id: applicationId,
        applicationStatus: Not(ApplicationStatus.Overwritten),
        student: {
          id: studentId,
        },
      },
    });
  }

  /**
   * Get assessment details of an application.
   * @param applicationId application.
   * @param options query options
   * - `studentId` student id used for authorization.
   * - `applicationStatus` application status/statuses to be considered.
   * @returns application details
   */
  async getApplicationAssessmentDetails(
    applicationId: number,
    options: {
      studentId?: number;
      applicationStatus?: ApplicationStatus[];
    },
  ): Promise<Application> {
    const applicationStatuses = options?.applicationStatus ?? [
      ApplicationStatus.Assessment,
      ApplicationStatus.Enrolment,
      ApplicationStatus.Completed,
    ];
    return this.repo.findOne({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          triggerType: true,
          disbursementSchedules: {
            id: true,
            coeStatus: true,
            disbursementDate: true,
            disbursementScheduleStatus: true,
            coeDeniedReason: { id: true, reason: true },
            coeDeniedOtherDesc: true,
          },
        },
        studentScholasticStandings: {
          id: true,
          changeType: true,
        },
      },
      relations: {
        currentAssessment: {
          disbursementSchedules: { coeDeniedReason: true },
        },
        studentScholasticStandings: true,
      },
      where: {
        id: applicationId,
        applicationStatus: In(applicationStatuses),
        student: {
          id: options?.studentId,
        },
      },
      order: {
        currentAssessment: {
          disbursementSchedules: { disbursementDate: "ASC" },
        },
      },
    });
  }

  /**
   * Gets the application details belonging to an institution location.
   * @param applicationId application id.
   * @param locationId optional location id.
   * @returns student application.
   */
  async getApplicationInfo(
    applicationId: number,
    locationId?: number,
  ): Promise<Application> {
    return this.repo.findOne({
      select: {
        id: true,
        applicationNumber: true,
        data: true as unknown,
        programYear: {
          id: true,
          active: true,
          startDate: true,
          endDate: true,
        },
        student: {
          id: true,
          birthDate: true,
          user: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          sinValidation: {
            id: true,
            sin: true,
          },
        },
      },
      relations: {
        programYear: true,
        location: true,
        student: {
          user: true,
          sinValidation: true,
        },
      },
      where: {
        id: applicationId,
        location: {
          id: locationId,
        },
        applicationStatus: Not(ApplicationStatus.Overwritten),
      },
    });
  }

  /**
   * Set of validations for existing application and newly
   * selected offering, like, application belongs to the location,
   * newly selected offering belongs to the location, is there any
   * overlapping study dates for the student, is the offering is
   * matching with the existing offering and the newly selected
   * offering belong to the same program year.
   * @param applicationId existing application id.
   * @param selectedOffering newly selected offering id.
   * @param locationId location id.
   */
  async validateApplicationOffering(
    applicationId: number,
    selectedOffering: number,
    locationId: number,
  ): Promise<void> {
    // Validate if the application exists and the location has access to it.
    const application = await this.getApplicationInfo(
      applicationId,
      locationId,
    );
    if (!application) {
      throw new CustomNamedError(
        "Application not found.",
        APPLICATION_NOT_FOUND,
      );
    }

    // Validates if the offering exists and belongs to the location.
    const offering = await this.offeringService.getOfferingLocationId(
      selectedOffering,
      locationId,
    );

    if (!offering) {
      throw new CustomNamedError(
        "The location does not have access to the offering.",
        OFFERING_DOES_NOT_BELONG_TO_LOCATION,
      );
    }

    // Validates if the Program is active.
    if (!offering.educationProgram.isActive) {
      throw new CustomNamedError(
        "The education program is not active.",
        EDUCATION_PROGRAM_IS_NOT_ACTIVE,
      );
    }

    // Validate possible overlaps with exists applications.
    await this.validateOverlappingDates(
      application.id,
      application.student.user.lastName,
      application.student.user.id,
      application.student.sinValidation.sin,
      application.student.birthDate,
      offering.studyStartDate,
      offering.studyEndDate,
    );

    // Check if the newly selected offering intensity
    // is matching with the existing offering intensity.
    const currentOfferingIntensity =
      application.data.howWillYouBeAttendingTheProgram;

    if (currentOfferingIntensity !== offering.offeringIntensity) {
      throw new CustomNamedError(
        "Offering intensity does not match with the student selected offering.",
        OFFERING_INTENSITY_MISMATCH,
      );
    }

    // Offering belongs to the application program year.
    if (!offeringBelongToProgramYear(offering, application.programYear)) {
      throw new CustomNamedError(
        "Program year is not matching with the application program year.",
        OFFERING_PROGRAM_YEAR_MISMATCH,
      );
    }
  }

  /**
   * Gets application and assessment status details.
   * @param applicationId application id.
   * @param options method options:
   * - `entityManager`: entity manager to be optionally used.
   * @returns application with assessment details populated.
   */
  async getApplicationAssessmentStatusDetails(
    applicationId: number,
    options?: { entityManager?: EntityManager },
  ): Promise<Application> {
    const applicationRepo = options?.entityManager
      ? options.entityManager.getRepository(Application)
      : this.repo;
    return applicationRepo.findOne({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          offering: { id: true },
          studentAppeal: { id: true },
        },
        studentAssessments: { studentAssessmentStatus: true },
        student: { id: true },
        isArchived: true,
        applicationStatus: true,
      },
      relations: {
        currentAssessment: { offering: true, studentAppeal: true },
        studentAssessments: true,
        student: true,
      },
      where: {
        id: applicationId,
        studentAssessments: {
          triggerType: AssessmentTriggerType.OriginalAssessment,
        },
      },
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
