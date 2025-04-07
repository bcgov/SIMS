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
  FileOriginType,
  ApplicationEditStatus,
  OfferingIntensity,
  InstitutionLocation,
  StudentAppeal,
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
  allowApplicationChangeRequest,
} from "../../utilities";
import { CustomNamedError, FieldSortOrder } from "@sims/utilities";
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
  EDUCATION_PROGRAM_IS_EXPIRED,
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
export const APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS =
  "APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS";

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
   * Assessment, Enrollment), then the existing application status is set to `Edited` and
   * applicationStatusUpdatedOn is updated and delete the corresponding workflow and creates a
   * new Application with same Application Number and Program Year as that of the Edited
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
     * status is set to `Edited` and applicationStatusUpdatedOn is updated and delete the
     * corresponding workflow and creates a new Application with same Application Number and
     * Program Year as that of the Edited Application and with newly submitted payload.
     */

    // Updating existing Application status to edited
    // and updating the ApplicationStatusUpdatedOn.
    application.applicationStatus = ApplicationStatus.Edited;
    application.applicationStatusUpdatedOn = now;

    // Creating New Application with same Application Number and Program Year as
    // that of the Edited Application and with newly submitted payload with
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
    newApplication.applicationEditStatus = ApplicationEditStatus.Edited;
    newApplication.applicationEditStatusUpdatedOn = now;
    newApplication.applicationEditStatusUpdatedBy = auditUser;
    newApplication.parentApplication = {
      id: application.parentApplication.id,
    } as Application;
    newApplication.precedingApplication = {
      id: application.id,
    } as Application;
    newApplication.applicationStatusUpdatedOn = now;
    newApplication.student = { id: studentId } as Student;
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
        studentId,
        transactionalEntityManager,
      );
    });
    return { application, createdAssessment: originalAssessment };
  }

  /**
   * Starts a change request for an existing student application.
   * A new application will be created in edited status and will be assessed by the Ministry.
   * @param applicationId application ID to be changed.
   * @param studentId student ID.
   * @param applicationData application dynamic data to be saved.
   * @param associatedFiles files to be associated with the application.
   * @param auditUserId user that should be considered the one that is making the change request.
   * @returns application ID of the created application that represents the change request.
   */
  async submitApplicationChangeRequest(
    applicationId: number,
    studentId: number,
    applicationData: ApplicationData,
    associatedFiles: string[],
    auditUserId: number,
  ): Promise<ApplicationSubmissionResult> {
    const application = await this.getApplicationToSave(
      studentId,
      ApplicationStatus.Completed,
      applicationId,
    );
    // If the application was not found it is because it does not belong to the student or it is not completed.
    if (!application) {
      throw new CustomNamedError(
        "Student application not found or it is not in the correct status to be changed.",
        APPLICATION_NOT_FOUND,
      );
    }
    if (!allowApplicationChangeRequest(application.programYear)) {
      throw new CustomNamedError(
        "The program year associated to this application does not allow a change request submission.",
        APPLICATION_NOT_VALID,
      );
    }
    // Check if there is already a change request in progress.
    const hasChangeInProgress = application.parentApplication.versions.some(
      (version) =>
        [
          ApplicationEditStatus.ChangeInProgress,
          ApplicationEditStatus.ChangePendingApproval,
        ].includes(version.applicationEditStatus),
    );
    if (hasChangeInProgress) {
      throw new CustomNamedError(
        "An application change request is already in progress.",
        APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS,
      );
    }
    // Validates selected location and selected offering as key values that
    // should not be changed. Even if some other values are changed (tampered by the user),
    // there will be no impact for application processing since the location and offering
    // are copied from the current application retrieved from the database.
    if (
      applicationData.selectedLocation !== application.data.selectedLocation
    ) {
      throw new CustomNamedError(
        "Change request has a different location from its original submission.",
        APPLICATION_NOT_VALID,
      );
    }
    if (
      applicationData.selectedOffering !== application.data.selectedOffering
    ) {
      // Applications are expected to have the same offering value populated, even for PIRs.
      // PIRs will not have the offering value populated and the assessment will be created
      // based on the most recent offering associated with the current application version.
      throw new CustomNamedError(
        "Change request has a different offering from its original submission.",
        APPLICATION_NOT_VALID,
      );
    }

    // Create the new assessment.
    const now = new Date();
    const auditUser = { id: auditUserId } as User;
    const originalAssessment = new StudentAssessment();
    originalAssessment.triggerType = AssessmentTriggerType.OriginalAssessment;
    originalAssessment.submittedBy = auditUser;
    originalAssessment.submittedDate = now;
    originalAssessment.creator = auditUser;
    originalAssessment.offering = {
      id: application.currentAssessment.offering.id,
    } as EducationProgramOffering;
    if (application.currentAssessment.studentAppeal) {
      originalAssessment.studentAppeal = {
        id: application.currentAssessment.studentAppeal.id,
      } as StudentAppeal;
    }
    // Creating new Application with same application number.
    const newApplication = new Application();
    // Current date is set as submitted date.
    newApplication.submittedDate = now;
    newApplication.applicationNumber = application.applicationNumber;
    newApplication.relationshipStatus = applicationData.relationshipStatus;
    newApplication.studentNumber = applicationData.studentNumber;
    newApplication.programYear = application.programYear;
    newApplication.data = applicationData;
    newApplication.location = {
      id: application.location.id,
    } as InstitutionLocation;
    newApplication.parentApplication = {
      id: application.parentApplication.id,
    } as Application;
    newApplication.precedingApplication = {
      id: application.id,
    } as Application;
    newApplication.student = { id: studentId } as Student;
    newApplication.studentFiles = await this.getSyncedApplicationFiles(
      studentId,
      [],
      associatedFiles,
    );
    // Application status related properties.
    newApplication.applicationStatus = ApplicationStatus.Edited;
    newApplication.applicationStatusUpdatedOn = now;
    // Application edit status related properties.
    newApplication.applicationEditStatus =
      ApplicationEditStatus.ChangeInProgress;
    newApplication.applicationEditStatusUpdatedOn = now;
    newApplication.applicationEditStatusUpdatedBy = auditUser;
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
      newApplication.modifier = auditUser;
      newApplication.updatedAt = now;
      newApplication.studentAssessments = [originalAssessment];
      newApplication.currentAssessment = originalAssessment;
      await applicationRepository.save(newApplication);
    });
    return {
      application: newApplication,
      createdAssessment: originalAssessment,
    };
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
   * @param options provided options
   * - `offeringIntensity` offering intensity associated with the application.
   * - `applicationId` application id used to execute validations.
   * @returns Student Application saved draft.
   */
  async saveDraftApplication(
    studentId: number,
    auditUserId: number,
    programYearId: number,
    applicationData: ApplicationData,
    associatedFiles: string[],
    options: {
      offeringIntensity?: OfferingIntensity;
      applicationId?: number;
    },
  ): Promise<Application> {
    let draftApplication = await this.getApplicationToSave(
      studentId,
      ApplicationStatus.Draft,
    );
    // If an application id is provided it means that an update is supposed to happen,
    // so an application draft is expected to be find. If not found, thrown an error.
    if (options.applicationId && !draftApplication) {
      throw new CustomNamedError(
        "Not able to find the draft application associated with the student.",
        APPLICATION_DRAFT_NOT_FOUND,
      );
    }
    // If an application id is not provided, an insert is supposed to happen
    // but, if an draft application already exists, it means that it is an
    // attempt to create a second draft and the student is supposed to
    // have only one draft.
    if (!options.applicationId && draftApplication) {
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
    const isNewDraftApplication = !draftApplication;
    if (isNewDraftApplication) {
      draftApplication = new Application();
      draftApplication.student = { id: studentId } as Student;
      draftApplication.programYear = { id: programYearId } as ProgramYear;
      draftApplication.offeringIntensity = options.offeringIntensity;
      draftApplication.applicationStatus = ApplicationStatus.Draft;
      draftApplication.applicationStatusUpdatedOn = now;
      draftApplication.creator = auditUser;
      draftApplication.createdAt = now;
      draftApplication.applicationEditStatus = ApplicationEditStatus.Original;
      draftApplication.applicationEditStatusUpdatedOn = now;
      draftApplication.applicationEditStatusUpdatedBy = auditUser;
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

    const savedDraftApplication = await this.repo.save(draftApplication);
    // Update application version properties for new draft application.
    if (isNewDraftApplication) {
      await this.repo.update(
        { id: savedDraftApplication.id },
        {
          precedingApplication: { id: savedDraftApplication.id },
          parentApplication: { id: savedDraftApplication.id },
        },
      );
    }
    return savedDraftApplication;
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
        fileOrigin: FileOriginType.Application,
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
        "pirProgram.description",
        "pirProgram.isActive",
        "pirProgram.effectiveEndDate",
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
      .andWhere("application.applicationStatus != :editedStatus", {
        editedStatus: ApplicationStatus.Edited,
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
   * - `allowEdited` indicates if Edited application is allowed.
   * @returns student application.
   */
  async getApplicationById(
    applicationId: number,
    options?: {
      loadDynamicData?: boolean;
      studentId?: number;
      institutionId?: number;
      allowEdited?: boolean;
    },
  ): Promise<Application> {
    const applicationStatus = options?.allowEdited
      ? undefined
      : Not(ApplicationStatus.Edited);
    return this.repo.findOne({
      select: {
        id: true,
        data: !!options?.loadDynamicData as unknown,
        applicationStatus: true,
        offeringIntensity: true,
        pirStatus: true,
        applicationStatusUpdatedOn: true,
        applicationNumber: true,
        pirDeniedOtherDesc: true,
        submittedDate: true,
        precedingApplication: { id: true },
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
          institution: {
            id: true,
            legalOperatingName: true,
          },
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
        student: {
          id: true,
          user: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      relations: {
        applicationException: true,
        currentAssessment: { offering: true },
        location: { institution: true },
        pirDeniedReasonId: true,
        programYear: true,
        student: { user: true },
        precedingApplication: true,
      },
      where: {
        id: applicationId,
        applicationStatus,
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
        "parentApplication.id",
        "parentApplication.submittedDate",
        "currentAssessment.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "application.applicationStatus",
        "programYear.programYear",
      ])
      .innerJoin("application.parentApplication", "parentApplication")
      .innerJoin("application.programYear", "programYear")
      .leftJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("currentAssessment.offering", "offering")
      .where("application.student.id = :studentId", { studentId })
      .andWhere("application.applicationStatus != :editedStatus", {
        editedStatus: ApplicationStatus.Edited,
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
   * other than completed, edited, cancelled will be passed.
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
        "parentApplication.id",
        "precedingApplication.id",
        "programYear.id",
        "programYear.programYear",
        "programYear.programYearPrefix",
        "studentFiles",
        "studentFile.uniqueFileName",
        "currentAssessment.id",
        "currentAssessment.assessmentWorkflowId",
        "location.id",
        "offering.id",
        "studentAppeal.id",
        "versions.id",
        "versions.applicationEditStatus",
      ])
      .innerJoin("application.programYear", "programYear")
      .leftJoin("application.location", "location")
      .leftJoin("application.parentApplication", "parentApplication")
      .leftJoin(
        "parentApplication.versions",
        "versions",
        "versions.applicationEditStatus IN (:...inProgressEditedStatuses)",
        {
          inProgressEditedStatuses: [
            ApplicationEditStatus.ChangeInProgress,
            ApplicationEditStatus.ChangePendingApproval,
          ],
        },
      )
      .leftJoin("application.precedingApplication", "precedingApplication")
      .leftJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("currentAssessment.offering", "offering")
      .leftJoin("currentAssessment.studentAppeal", "studentAppeal")
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
          ApplicationStatus.Edited,
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
          applicationStatus: ApplicationStatus.Edited,
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
  async getPIRApplications(
    locationId: number,
    page: number,
    pageLimit: number,
    sortField?: string,
    sortOrder?: "ASC" | "DESC",
    search?: string,
    intensityFilter?: string[],
  ): Promise<{ results: Application[]; count: number }> {
    const query = this.repo
      .createQueryBuilder("application")
      .select([
        "application.applicationNumber",
        "application.id",
        "application.pirStatus",
        "application.submittedDate",
        "application.studentNumber",
        "application.offeringIntensity",
        "application.data",
        "currentAssessment.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "educationProgram.name",
        "student.id",
        "user.firstName",
        "user.lastName",
        "pirProgram.name",
      ])
      .leftJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("currentAssessment.offering", "offering")
      .leftJoin("offering.educationProgram", "educationProgram")
      .leftJoin("application.pirProgram", "pirProgram")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("application.location.id = :locationId", { locationId })
      .andWhere("application.pirStatus is not null")
      .andWhere("application.pirStatus != :nonPirStatus", {
        nonPirStatus: ProgramInfoStatus.notRequired,
      })
      .andWhere("application.applicationStatus != :editedStatus", {
        editedStatus: ApplicationStatus.Edited,
      });

    // Apply search by name or application number if provided
    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(getUserFullNameLikeSearch("user", "search")).orWhere(
            "application.applicationNumber ILIKE :search",
          );
        }),
      );
      query.setParameter("search", `%${search}%`);
    }
    if (intensityFilter?.length) {
      query.andWhere("application.offeringIntensity IN (:...intensityFilter)", {
        intensityFilter,
      });
    }
    if (!sortField || !sortOrder) {
      query.orderBy("application.pirStatus", "DESC");
      query.addOrderBy("application.applicationNumber", "ASC");
    } else {
      const fieldSortOrder =
        sortOrder === "ASC" ? FieldSortOrder.ASC : FieldSortOrder.DESC;
      const dbSortField = transformToApplicationEntitySortField(
        sortField,
        fieldSortOrder,
      );

      // Handle sort fields one at a time
      let firstField = true;
      for (const [field, order] of Object.entries(dbSortField)) {
        if (firstField) {
          // First field uses orderBy
          if (
            field === "application.submittedDate" ||
            field === "offering.studyStartDate" ||
            field === "offering.studyEndDate"
          ) {
            query.orderBy(field, order as any, "NULLS LAST");
          } else {
            query.orderBy(field, order as any);
          }
          firstField = false;
        } else {
          // Subsequent fields use addOrderBy
          if (
            field === "application.submittedDate" ||
            field === "offering.studyStartDate" ||
            field === "offering.studyEndDate"
          ) {
            query.addOrderBy(field, order as any, "NULLS LAST");
          } else {
            query.addOrderBy(field, order as any);
          }
        }
      }

      // Always add application number as a secondary sort
      query.addOrderBy("application.applicationNumber", "ASC");
    }
    query.skip((page - 1) * pageLimit).take(pageLimit);
    const [results, count] = await query.getManyAndCount();
    return { results, count };
  }

  /**
   * Update Student Application status to cancelled.
   * Only allows the update on applications that are not in a final status.
   * The final statuses of an application are Completed, Edited and Cancelled.
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
            ApplicationStatus.Edited,
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
          applicationStatus: ApplicationStatus.Edited,
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
        "application.id",
        "application.applicationStatus",
        "application.applicationNumber",
        "application.isArchived",
        "currentAssessment.id",
        "offering.id",
        "offering.offeringIntensity",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "educationProgram.name",
        "educationProgram.description",
        "location.name",
        "offering.name",
        "student",
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.email",
        "studentAppeal.id",
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
      .leftJoin("currentAssessment.studentAppeal", "studentAppeal")
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
        "currentAssessment",
        "offering.offeringIntensity",
      ])
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
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
          ApplicationStatus.Edited,
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

  /**
   * Check if a Student Application exists.
   * @param options query options.
   * - `applicationId` application id.
   * - `applicationNumber` application number.
   * - `studentId` student id, useful for authorization to ensure
   * the student has access to the application.
   * @returns true if the application exists, otherwise false.
   */
  async doesApplicationExist(options: {
    applicationId?: number;
    applicationNumber?: string;
    studentId?: number;
  }): Promise<boolean> {
    if (!options.applicationId && !options.applicationNumber) {
      throw new Error(
        "At least one application identifier is required while checking if an applications exists.",
      );
    }
    return this.repo.exists({
      where: {
        id: options.applicationId,
        applicationNumber: options.applicationNumber,
        student: { id: options.studentId },
      },
    });
  }

  /**
   * Retrieves the application to request an appeal.
   * @param applicationId application ID.
   * @param userId user id.
   * @returns application details for an appeal.
   */
  async getApplicationToRequestAppeal(
    applicationId: number,
    userId: number,
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
        id: applicationId,
      },
    });
  }

  /**
   * Validation for application overlapping dates or Pending PIR.
   * This validation can be disabled by setting BYPASS_APPLICATION_SUBMIT_VALIDATIONS to true in .env file.
   * @param applicationId application id.
   * @param userId user id.
   * @param studentId student id.
   * @param studyStartDate study start date.
   * @param studyEndDate study end date.
   */
  async validateOverlappingDates(
    applicationId: number,
    userId: number,
    studentId: number,
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
          studentId,
          studyStartDate,
          studyEndDate,
        );

      const existingSFASPTApplication =
        this.sfasPartTimeApplicationsService.validateDateOverlap(
          studentId,
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
   * @param options options
   * - `studentId` student id.
   * @returns application details
   */
  async getApplicationDetails(
    applicationId: number,
    options?: { studentId?: number },
  ): Promise<Application> {
    return this.repo.findOne({
      select: {
        id: true,
        applicationStatus: true,
        applicationNumber: true,
        student: {
          id: true,
        },
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
          triggerType: true,
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
        programYear: { id: true },
      },
      relations: {
        student: true,
        pirDeniedReasonId: true,
        currentAssessment: { offering: true, disbursementSchedules: true },
        applicationException: true,
        location: true,
        studentScholasticStandings: true,
        programYear: true,
      },
      where: {
        id: applicationId,
        applicationStatus: Not(ApplicationStatus.Edited),
        student: {
          id: options?.studentId,
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
        offeringIntensity: true,
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
        applicationStatus: Not(ApplicationStatus.Edited),
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

    // Validates if the program is expired.
    if (offering.educationProgram.isExpired) {
      throw new CustomNamedError(
        "The education program is expired.",
        EDUCATION_PROGRAM_IS_EXPIRED,
      );
    }

    // Validate possible overlaps with exists applications.
    await this.validateOverlappingDates(
      application.id,
      application.student.user.id,
      application.student.id,
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

  /**
   * Check if the application has any feedback errors received
   * that will block the student funding.
   * @param applicationId application.
   * @returns flag which indicates if application has any errors
   * blocking funding.
   */
  async hasFeedbackErrorBlockingFunds(applicationId: number): Promise<boolean> {
    return this.repo.exists({
      where: {
        id: applicationId,
        currentAssessment: {
          disbursementSchedules: {
            disbursementFeedbackErrors: {
              eCertFeedbackError: { blockFunding: true },
            },
          },
        },
      },
    });
  }

  /**
   * Get all the application versions for an application through parent application.
   * @param applicationId application id.
   * @param options query options.
   * - `studentId` student ID used for authorization.
   * @returns application versions if any, otherwise empty array.
   */
  async getAllApplicationVersions(
    applicationId: number,
    options?: { studentId?: number },
  ): Promise<Application[]> {
    const applicationQuery = this.repo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "parentApplication.id",
        "version.id",
        "version.submittedDate",
        "version.applicationEditStatus",
      ])
      .innerJoin("application.parentApplication", "parentApplication")
      .leftJoin(
        "parentApplication.versions",
        "version",
        "version.applicationStatus = :editedStatus",
        { editedStatus: ApplicationStatus.Edited },
      )
      .where("application.id = :applicationId", {
        applicationId: applicationId,
      })
      .orderBy("version.submittedDate", "DESC");
    if (options?.studentId) {
      applicationQuery.andWhere("application.student.id = :studentId", {
        studentId: options.studentId,
      });
    }
    const application = await applicationQuery.getOne();
    if (!application) {
      throw new CustomNamedError(
        "Application not found.",
        APPLICATION_NOT_FOUND,
      );
    }
    return application.parentApplication.versions;
  }

  /**
   * Get application data.
   * @param applicationId application id.
   * @returns the application data.
   */
  async getApplicationData(applicationId: number): Promise<Application> {
    return this.repo.findOne({
      select: { id: true, data: true as unknown },
      where: { id: applicationId },
    });
  }

  /**
   * Gets the current application by parent application id.
   * @param parentApplicationId parent application id.
   * @returns the application.
   */
  async getCurrentApplicationByParentApplicationId(
    parentApplicationId: number,
  ): Promise<Application> {
    return this.repo.findOne({
      select: { id: true, submittedDate: true },
      where: {
        parentApplication: {
          id: parentApplicationId,
        },
        applicationStatus: Not(ApplicationStatus.Edited),
      },
      order: { submittedDate: "DESC" },
    });
  }

  /**
   * Get information required for an application submission validation.
   * @param applicationId application ID.
   * @param studentId student to check for authorization.
   * @returns application data for submission validation.
   */
  async getApplicationForSubmissionValidation(
    applicationId: number,
    studentId: number,
  ): Promise<Application> {
    return this.repo.findOne({
      select: {
        id: true,
        programYear: { id: true, formName: true, active: true },
        offeringIntensity: true,
      },
      relations: {
        programYear: true,
      },
      where: {
        id: applicationId,
        student: { id: studentId },
      },
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
