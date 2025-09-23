import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  ApplicationRestrictionBypass,
  ApplicationStatus,
  NoteType,
  OfferingIntensity,
  RestrictionActionType,
  StudentRestriction,
  User,
} from "@sims/sims-db";
import {
  ArrayOverlap,
  DataSource,
  EntityManager,
  Repository,
  UpdateResult,
} from "typeorm";
import { CustomNamedError } from "@sims/utilities";
import {
  ACTIVE_BYPASS_FOR_STUDENT_RESTRICTION_ALREADY_EXISTS,
  APPLICATION_RESTRICTION_BYPASS_NOT_FOUND,
  APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION,
  STUDENT_RESTRICTION_IS_NOT_ACTIVE,
  APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE,
  STUDENT_RESTRICTION_NOT_FOUND,
} from "../../constants";
import {
  AvailableStudentRestrictionData,
  BypassRestrictionData,
} from "../../services/";
import { NoteSharedService } from "@sims/services";

/**
 * Service layer for application restriction bypasses.
 */
@Injectable()
export class ApplicationRestrictionBypassService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StudentRestriction)
    private readonly studentRestrictionRepo: Repository<StudentRestriction>,
    @InjectRepository(ApplicationRestrictionBypass)
    private readonly applicationRestrictionBypassRepo: Repository<ApplicationRestrictionBypass>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly noteSharedService: NoteSharedService,
  ) {}

  /**
   * Returns all application restriction bypasses for a given application.
   * @param applicationId id of the application to retrieve restriction bypasses.
   * @returns application restriction bypasses.
   */
  async getApplicationRestrictionBypasses(
    applicationId: number,
  ): Promise<ApplicationRestrictionBypass[]> {
    return this.applicationRestrictionBypassRepo.find({
      select: {
        id: true,
        isActive: true,
        studentRestriction: {
          id: true,
          isActive: true,
          deletedAt: true,
          restriction: {
            id: true,
            restrictionCategory: true,
            restrictionCode: true,
          },
        },
      },
      relations: {
        studentRestriction: { restriction: true },
      },
      where: {
        application: {
          id: applicationId,
        },
      },
      withDeleted: true,
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Gets an application restriction bypass by id.
   * @param id id of the application restriction bypass to retrieve.
   * @returns application restriction bypass.
   */
  async getApplicationRestrictionBypass(
    id: number,
  ): Promise<ApplicationRestrictionBypass> {
    return this.applicationRestrictionBypassRepo.findOne({
      select: {
        id: true,
        isActive: true,
        studentRestriction: {
          id: true,
          restriction: {
            restrictionCode: true,
          },
        },
        creationNote: {
          description: true,
        },
        removalNote: {
          description: true,
        },
        bypassCreatedBy: {
          firstName: true,
          lastName: true,
        },
        bypassCreatedDate: true,
        bypassRemovedBy: {
          firstName: true,
          lastName: true,
        },
        bypassRemovedDate: true,
        bypassBehavior: true,
      },
      relations: {
        studentRestriction: { restriction: true },
        creationNote: true,
        removalNote: true,
        bypassCreatedBy: true,
        bypassRemovedBy: true,
      },
      where: {
        id,
      },
      withDeleted: true,
    });
  }

  /**
   * Gets all available student restrictions to bypass for a given application.
   * @param applicationId application id.
   * @returns list of application restriction bypass options.
   */
  async getAvailableStudentRestrictionsToBypass(
    applicationId: number,
  ): Promise<AvailableStudentRestrictionData[]> {
    const application = await this.applicationRepo.findOne({
      select: {
        id: true,
        student: {
          id: true,
          studentRestrictions: {
            id: true,
            restriction: {
              id: true,
              restrictionCode: true,
              actionType: true,
            },
            applicationRestrictionBypasses: {
              id: true,
              studentRestriction: { id: true },
              isActive: true,
            },
            createdAt: true,
          },
        },
        currentAssessment: {
          id: true,
          offering: {
            id: true,
            offeringIntensity: true,
          },
        },
      },
      relations: {
        student: {
          studentRestrictions: {
            restriction: true,
            applicationRestrictionBypasses: {
              studentRestriction: true,
            },
          },
        },
        currentAssessment: { offering: true },
      },
      where: {
        id: applicationId,
        student: {
          studentRestrictions: {
            isActive: true,
            restriction: {
              actionType: ArrayOverlap([
                RestrictionActionType.StopFullTimeBCFunding,
                RestrictionActionType.StopFullTimeDisbursement,
                RestrictionActionType.StopPartTimeBCFunding,
                RestrictionActionType.StopPartTimeDisbursement,
              ]),
            },
          },
        },
      },
    });
    // In case no application is found, return an empty array.
    if (!application) {
      return [];
    }
    const allowedRestrictionActions =
      application.currentAssessment.offering.offeringIntensity ===
      OfferingIntensity.fullTime
        ? [
            RestrictionActionType.StopFullTimeBCFunding,
            RestrictionActionType.StopFullTimeDisbursement,
          ]
        : [
            RestrictionActionType.StopPartTimeBCFunding,
            RestrictionActionType.StopPartTimeDisbursement,
          ];

    const bypassedStudentRestrictionIds =
      application.student.studentRestrictions
        .flatMap(
          (studentRestriction) =>
            studentRestriction.applicationRestrictionBypasses,
        )
        .filter((bypass) => bypass.isActive)
        .map((bypass) => bypass.studentRestriction.id);

    const studentRestrictionsThatAreNotBypassed =
      application.student.studentRestrictions.filter(
        (studentRestriction) =>
          !bypassedStudentRestrictionIds.includes(studentRestriction.id),
      );

    return studentRestrictionsThatAreNotBypassed
      .filter((studentRestriction) =>
        allowedRestrictionActions.some((actionType) =>
          studentRestriction.restriction.actionType.includes(actionType),
        ),
      )
      .map((studentRestriction) => ({
        studentRestrictionId: studentRestriction.id,
        restrictionCode: studentRestriction.restriction.restrictionCode,
        studentRestrictionCreatedAt: studentRestriction.createdAt,
      }))
      .sort((a, b) => a.restrictionCode.localeCompare(b.restrictionCode));
  }

  /**
   * Creates a new application restriction bypass.
   * @param payload application restriction bypass data.
   * @param auditUserId id of the user who is creating the bypass.
   * @returns created application restriction bypass.
   */
  async bypassRestriction(
    payload: BypassRestrictionData,
    auditUserId: number,
  ): Promise<ApplicationRestrictionBypass> {
    const checkForActiveApplicationStudentRestrictionBypassesPromise =
      this.checkForActiveApplicationStudentRestrictionBypasses(
        payload.applicationId,
        payload.studentRestrictionId,
      );
    const checkForActiveStudentRestrictionPromise =
      this.checkForActiveStudentRestriction(payload.studentRestrictionId);
    const checkForApplicationInValidStatePromise =
      this.checkForApplicationInValidState(payload.applicationId);
    await Promise.all([
      checkForActiveApplicationStudentRestrictionBypassesPromise,
      checkForActiveStudentRestrictionPromise,
      checkForApplicationInValidStatePromise,
    ]);
    const studentApplication = await this.applicationRepo.findOne({
      select: {
        student: { id: true },
      },
      relations: { student: true },
      where: {
        id: payload.applicationId,
      },
    });
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const noteObj = await this.noteSharedService.createStudentNote(
        studentApplication.student.id,
        NoteType.Application,
        payload.note,
        auditUserId,
        transactionalEntityManager,
      );
      const now = new Date();
      const auditUser = { id: auditUserId } as User;
      return transactionalEntityManager
        .getRepository(ApplicationRestrictionBypass)
        .save({
          application: { id: payload.applicationId },
          studentRestriction: { id: payload.studentRestrictionId },
          isActive: true,
          bypassCreatedDate: now,
          bypassCreatedBy: auditUser,
          creator: auditUser,
          createdAt: now,
          bypassBehavior: payload.bypassBehavior,
          creationNote: noteObj,
        });
    });
  }

  /**
   * Checks if the application is in a valid state for bypass creation.
   * Throws an error if the application is in a Draft, Cancelled,
   * or Edited state.
   * @param applicationId id of the application to check.
   */
  private async checkForApplicationInValidState(
    applicationId: number,
  ): Promise<void> {
    const application = await this.applicationRepo.findOne({
      select: {
        applicationStatus: true,
      },
      where: {
        id: applicationId,
      },
    });
    if (
      [
        ApplicationStatus.Draft,
        ApplicationStatus.Cancelled,
        ApplicationStatus.Edited,
      ].includes(application.applicationStatus)
    ) {
      throw new CustomNamedError(
        "Cannot create a bypass when application is in invalid state.",
        APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION,
      );
    }
  }

  /**
   * Checks if a student restriction is active.
   * Throws an error if the student restriction is not found
   * or if it is not active.
   * @param studentRestrictionId id of the student restriction to check.
   */
  private async checkForActiveStudentRestriction(
    studentRestrictionId: number,
  ): Promise<void> {
    const studentRestriction = await this.studentRestrictionRepo.findOne({
      select: {
        isActive: true,
      },
      where: {
        id: studentRestrictionId,
      },
    });
    if (!studentRestriction) {
      throw new CustomNamedError(
        "Could not find student restriction for the given id.",
        STUDENT_RESTRICTION_NOT_FOUND,
      );
    }
    if (studentRestriction.isActive === false) {
      throw new CustomNamedError(
        "Cannot create a bypass when student restriction is not active.",
        STUDENT_RESTRICTION_IS_NOT_ACTIVE,
      );
    }
  }

  /**
   * Checks if there is an active application student restriction bypass.
   * Throws an error if there is an active bypass for the same active student restriction id.
   * @param applicationId id of the application to check.
   * @param studentRestrictionId id of the student restriction to check.
   */
  private async checkForActiveApplicationStudentRestrictionBypasses(
    applicationId: number,
    studentRestrictionId: number,
  ): Promise<void> {
    const existsActiveStudentRestriction =
      await this.applicationRestrictionBypassRepo.exists({
        where: {
          application: {
            id: applicationId,
          },
          studentRestriction: {
            id: studentRestrictionId,
          },
          isActive: true,
        },
      });
    if (existsActiveStudentRestriction) {
      throw new CustomNamedError(
        "Cannot create a bypass when there is an active bypass for the same active student restriction.",
        ACTIVE_BYPASS_FOR_STUDENT_RESTRICTION_ALREADY_EXISTS,
      );
    }
  }

  /**
   * Removes an application restriction bypass.
   * @param id id of the application restriction bypass to remove.
   * @param removalNote removal note for the application restriction bypass.
   * @param auditUserId id of the audit user.
   * @returns updated application restriction bypass.
   */
  async removeBypassRestriction(
    id: number,
    removalNote: string,
    auditUserId: number,
  ): Promise<UpdateResult> {
    const applicationRestrictionBypass =
      await this.applicationRestrictionBypassRepo.findOne({
        select: {
          id: true,
          isActive: true,
          studentRestriction: {
            isActive: true,
          },
          application: {
            id: true,
            applicationStatus: true,
            student: { id: true },
          },
        },
        relations: {
          studentRestriction: true,
          application: { student: true },
        },
        where: {
          id,
        },
      });
    if (!applicationRestrictionBypass) {
      throw new CustomNamedError(
        "Application restriction bypass not found.",
        APPLICATION_RESTRICTION_BYPASS_NOT_FOUND,
      );
    }
    if (applicationRestrictionBypass.isActive !== true) {
      throw new CustomNamedError(
        "Cannot remove a bypass when application restriction bypass is not active.",
        APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE,
      );
    }
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      return this.updateBypassToRemoved(
        id,
        removalNote,
        applicationRestrictionBypass.application.student.id,
        auditUserId,
        transactionalEntityManager,
      );
    });
  }

  /**
   * Finds and removes all active bypasses for a given student restriction id.
   * @param studentRestrictionId id of the student restriction that cause the
   * bypass to be removed.
   * @param auditUserId id of the user performing the action.
   * @param reason reason for the removal of the bypasses to be appended to the note.
   * @param entityManager entity manager to be used in the transaction.
   */
  async bulkRemoveBypassRestriction(
    studentRestrictionId: number,
    auditUserId: number,
    reason: string,
    entityManager: EntityManager,
  ): Promise<void> {
    const bypassRepo = entityManager.getRepository(
      ApplicationRestrictionBypass,
    );
    const applicationRestrictionBypasses = await bypassRepo.find({
      select: {
        id: true,
        isActive: true,
        application: {
          id: true,
          applicationNumber: true,
          student: { id: true },
        },
        studentRestriction: {
          id: true,
          restriction: { id: true, restrictionCode: true },
        },
      },
      relations: {
        application: { student: true },
        studentRestriction: { restriction: true },
      },
      where: {
        studentRestriction: { id: studentRestrictionId, restriction: true },
      },
      withDeleted: true,
    });
    if (!applicationRestrictionBypasses.length) {
      return;
    }
    // Execute all updates in parallel to optimize performance.
    // Just one to few records are expected to be bypassed at a time for a given student restriction,
    // hence there is no need to limit the concurrency.
    const updatedBypassesPromises = applicationRestrictionBypasses.map(
      async (bypass) => {
        const note = `Application ${bypass.application.applicationNumber} had the bypass for the restriction ${bypass.studentRestriction.restriction.restrictionCode} removed. Reason: ${reason}.`;
        return this.updateBypassToRemoved(
          bypass.id,
          note,
          bypass.application.student.id,
          auditUserId,
          entityManager,
        );
      },
    );
    await Promise.all(updatedBypassesPromises);
  }

  /**
   * Make the necessary changes to the bypass to mark it as removed.
   * @param bypassId id of the bypass to be removed.
   * @param note removal note.
   * @param studentId id of the student to whom the note will be associated.
   * @param auditUserId id of the user performing the action.
   * @param entityManager entity manager to be used in the transaction.
   */
  private async updateBypassToRemoved(
    bypassId: number,
    note: string,
    studentId: number,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<UpdateResult> {
    const now = new Date();
    const auditUser = { id: auditUserId } as User;
    const bypassRepo = entityManager.getRepository(
      ApplicationRestrictionBypass,
    );
    const removalNote = await this.noteSharedService.createStudentNote(
      studentId,
      NoteType.Application,
      note,
      auditUserId,
      entityManager,
    );
    const updateResult = await bypassRepo.update(
      { id: bypassId, isActive: true },
      {
        isActive: false,
        bypassRemovedDate: now,
        bypassRemovedBy: auditUser,
        removalNote: removalNote,
        modifier: auditUser,
      },
    );
    if (!updateResult.affected) {
      throw new CustomNamedError(
        "Failed to remove the application restriction bypass, it may have been already removed.",
        APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE,
      );
    }
    return updateResult;
  }
}
