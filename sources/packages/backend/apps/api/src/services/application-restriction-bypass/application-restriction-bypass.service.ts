import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  ApplicationRestrictionBypass,
  ApplicationStatus,
  InstitutionRestriction,
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
  ACTIVE_BYPASS_FOR_RESTRICTED_PARTY_ALREADY_EXISTS,
  APPLICATION_RESTRICTION_BYPASS_NOT_FOUND,
  APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION,
  APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE,
  APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_REMOVAL,
  RESTRICTION_NOT_FOUND,
  RESTRICTION_IS_NOT_ACTIVE,
  RESTRICTION_BYPASS_NOT_ELIGIBLE,
} from "../../constants";
import {
  AvailableRestrictionData,
  BypassRestrictionData,
} from "../../services/";
import { NoteSharedService, RestrictedParty } from "@sims/services";

/**
 * Invalid application statuses for bypass creation or removal.
 */
const INVALID_STATUSES_FOR_BYPASS_OPERATION = new Set([
  ApplicationStatus.Draft,
  ApplicationStatus.Cancelled,
  ApplicationStatus.Edited,
]);

/**
 * Service layer for application restriction bypasses.
 */
@Injectable()
export class ApplicationRestrictionBypassService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StudentRestriction)
    private readonly studentRestrictionRepo: Repository<StudentRestriction>,
    @InjectRepository(InstitutionRestriction)
    private readonly institutionRestrictionRepo: Repository<InstitutionRestriction>,
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
        institutionRestriction: {
          id: true,
          isActive: true,
          restriction: {
            id: true,
            restrictionCategory: true,
            restrictionCode: true,
          },
        },
      },
      relations: {
        studentRestriction: { restriction: true },
        institutionRestriction: { restriction: true },
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
        institutionRestriction: {
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
        institutionRestriction: { restriction: true },
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
   * Gets all available restrictions to bypass for a given application.
   * @param applicationId application id.
   * @returns list of application restriction bypass options.
   */
  async getAvailableRestrictionsToBypass(
    applicationId: number,
  ): Promise<AvailableRestrictionData[]> {
    // Run both queries in parallel
    const [studentRestrictions, institutionRestrictions] = await Promise.all([
      this.getAvailableStudentRestrictionsToBypass(applicationId),
      this.getAvailableInstitutionRestrictionsToBypass(applicationId),
    ]);
    return [...studentRestrictions, ...institutionRestrictions].sort((a, b) =>
      a.restrictionCode.localeCompare(b.restrictionCode),
    );
  }

  /**
   * Gets all available student restrictions to bypass for a given application.
   * @param applicationId application id.
   * @returns list of available student restriction bypass options.
   */
  private async getAvailableStudentRestrictionsToBypass(
    applicationId: number,
  ): Promise<AvailableRestrictionData[]> {
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
                RestrictionActionType.StopFullTimeBCLoan,
                RestrictionActionType.StopFullTimeBCGrants,
                RestrictionActionType.StopFullTimeDisbursement,
                RestrictionActionType.StopPartTimeBCGrants,
                RestrictionActionType.StopPartTimeDisbursement,
              ]),
            },
          },
        },
      },
    });
    if (!application) {
      return [];
    }
    const allowedRestrictionActions = this.getAllowedRestrictionActions(
      application.currentAssessment.offering.offeringIntensity,
    );
    const bypassedStudentRestrictionIds = new Set(
      application.student.studentRestrictions
        .flatMap(
          (studentRestriction) =>
            studentRestriction.applicationRestrictionBypasses,
        )
        .filter((bypass) => bypass.isActive)
        .map((bypass) => bypass.studentRestriction.id),
    );
    const studentRestrictionsThatAreNotBypassed =
      application.student.studentRestrictions.filter(
        (studentRestriction) =>
          !bypassedStudentRestrictionIds.has(studentRestriction.id),
      );
    return studentRestrictionsThatAreNotBypassed
      .filter((studentRestriction) =>
        allowedRestrictionActions.some((actionType) =>
          studentRestriction.restriction.actionType.includes(actionType),
        ),
      )
      .map((studentRestriction) => ({
        restrictionId: studentRestriction.id,
        restrictionCode: studentRestriction.restriction.restrictionCode,
        restrictionCreatedAt: studentRestriction.createdAt,
        restrictedParty: RestrictedParty.Student,
      }));
  }

  /**
   * Gets all available institution restrictions to bypass for a given application.
   * @param applicationId application id.
   * @returns list of available institution restriction bypass options.
   */
  private async getAvailableInstitutionRestrictionsToBypass(
    applicationId: number,
  ): Promise<AvailableRestrictionData[]> {
    const activeInstitutionRestrictionBypasses =
      this.applicationRestrictionBypassRepo
        .createQueryBuilder("applicationRestrictionBypass")
        .select("1")
        .where(
          "applicationRestrictionBypass.institutionRestriction.id = institutionRestriction.id",
        )
        .andWhere(
          "applicationRestrictionBypass.application.id = application.id",
        )
        .andWhere("applicationRestrictionBypass.isActive = true")
        .getQuery();
    const institutionApplication = await this.applicationRepo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "currentAssessment.id",
        "offering.id",
        "offering.offeringIntensity",
        "offeringProgram.id",
        "institutionLocation.id",
        "institution.id",
        "institutionRestriction.id",
        "institutionRestriction.createdAt",
        "instRestrictionDetail.id",
        "instRestrictionDetail.restrictionCode",
        "instRestrictionDetail.actionType",
      ])
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.educationProgram", "offeringProgram")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .innerJoin("institutionLocation.institution", "institution")
      .leftJoin(
        "institution.restrictions",
        "institutionRestriction",
        "institutionRestriction.isActive = TRUE AND institutionRestriction.program = offeringProgram.id AND institutionRestriction.location = institutionLocation.id",
      )
      .innerJoin("institutionRestriction.restriction", "instRestrictionDetail")
      .where("application.id = :applicationId", { applicationId })
      .andWhere(`NOT EXISTS (${activeInstitutionRestrictionBypasses})`)
      .getOne();
    if (!institutionApplication) {
      return [];
    }
    // Determine allowed restriction actions based on offering intensity
    const offeringIntensity =
      institutionApplication.currentAssessment.offering.offeringIntensity;
    const allowedRestrictionActions =
      this.getAllowedRestrictionActions(offeringIntensity);
    const institutionRestrictionsThatAreNotBypassed =
      institutionApplication.currentAssessment.offering.institutionLocation
        .institution.restrictions;
    // Filter by allowed restriction actions
    const filteredInstitutionRestrictions =
      institutionRestrictionsThatAreNotBypassed.filter(
        (institutionRestriction) =>
          allowedRestrictionActions.some((actionType) =>
            institutionRestriction.restriction.actionType.includes(actionType),
          ),
      );
    return filteredInstitutionRestrictions.map((institutionRestriction) => ({
      restrictionId: institutionRestriction.id,
      restrictionCode: institutionRestriction.restriction.restrictionCode,
      restrictionCreatedAt: institutionRestriction.createdAt,
      restrictedParty: RestrictedParty.Institution,
    }));
  }

  /**
   * Validates if a restriction is eligible for bypass.
   * @param applicationId application Id.
   * @param restrictionId restriction Id.
   * @param restrictedParty restricted party (student or institution).
   * @throws {CustomNamedError} if the restriction is not eligible for bypass with error code RESTRICTION_BYPASS_NOT_ELIGIBLE.
   */
  private async validateRestrictionBypassEligibility(
    applicationId: number,
    restrictionId: number,
    restrictedParty: RestrictedParty,
  ): Promise<void> {
    let restrictions: AvailableRestrictionData[] = [];
    if (restrictedParty === RestrictedParty.Student) {
      restrictions =
        await this.getAvailableStudentRestrictionsToBypass(applicationId);
    } else {
      restrictions =
        await this.getAvailableInstitutionRestrictionsToBypass(applicationId);
    }
    const isEligible = restrictions.some(
      (restriction) => restriction.restrictionId === restrictionId,
    );
    if (!isEligible) {
      throw new CustomNamedError(
        "Restriction is not eligible for bypass.",
        RESTRICTION_BYPASS_NOT_ELIGIBLE,
      );
    }
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
    const checkForActiveApplicationRestrictionBypassesPromise =
      this.checkForActiveApplicationRestrictionBypasses(
        payload.applicationId,
        payload.restrictionId,
        payload.restrictedParty,
      );
    const checkForActiveRestrictionPromise = this.checkForActiveRestriction(
      payload.restrictionId,
      payload.restrictedParty,
    );
    const checkForApplicationInValidStatePromise =
      this.checkForApplicationInValidState(payload.applicationId);
    await Promise.all([
      checkForActiveApplicationRestrictionBypassesPromise,
      checkForActiveRestrictionPromise,
      checkForApplicationInValidStatePromise,
    ]);
    await this.validateRestrictionBypassEligibility(
      payload.applicationId,
      payload.restrictionId,
      payload.restrictedParty,
    );
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
      const bypass: Partial<ApplicationRestrictionBypass> = {
        application: { id: payload.applicationId } as Application,
        isActive: true,
        bypassCreatedDate: now,
        bypassCreatedBy: auditUser,
        creator: auditUser,
        createdAt: now,
        bypassBehavior: payload.bypassBehavior,
        creationNote: noteObj,
      };
      if (payload.restrictedParty === RestrictedParty.Student) {
        bypass.studentRestriction = {
          id: payload.restrictionId,
        } as StudentRestriction;
      } else {
        bypass.institutionRestriction = {
          id: payload.restrictionId,
        } as InstitutionRestriction;
      }
      return transactionalEntityManager
        .getRepository(ApplicationRestrictionBypass)
        .save(bypass);
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
      INVALID_STATUSES_FOR_BYPASS_OPERATION.has(application.applicationStatus)
    ) {
      throw new CustomNamedError(
        "Cannot create a bypass when application is in invalid state.",
        APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION,
      );
    }
  }

  /**
   * Checks if a restriction is active.
   * Throws an error if the restriction is not found
   * or if it is not active.
   * @param restrictionId id of the restriction to check.
   * @param restrictionType type of the restriction to check.
   */
  private async checkForActiveRestriction(
    restrictionId: number,
    restrictionType: RestrictedParty,
  ): Promise<void> {
    if (restrictionType === RestrictedParty.Institution) {
      const institutionRestriction =
        await this.institutionRestrictionRepo.findOne({
          select: {
            isActive: true,
          },
          where: {
            id: restrictionId,
          },
        });
      if (!institutionRestriction) {
        throw new CustomNamedError(
          "Could not find institution restriction for the given id.",
          RESTRICTION_NOT_FOUND,
        );
      }
      if (!institutionRestriction.isActive) {
        throw new CustomNamedError(
          "Cannot create a bypass when institution restriction is not active.",
          RESTRICTION_IS_NOT_ACTIVE,
        );
      }
    }
    if (restrictionType === RestrictedParty.Student) {
      const studentRestriction = await this.studentRestrictionRepo.findOne({
        select: {
          isActive: true,
        },
        where: {
          id: restrictionId,
        },
      });
      if (!studentRestriction) {
        throw new CustomNamedError(
          "Could not find student restriction for the given id.",
          RESTRICTION_NOT_FOUND,
        );
      }
      if (!studentRestriction.isActive) {
        throw new CustomNamedError(
          "Cannot create a bypass when student restriction is not active.",
          RESTRICTION_IS_NOT_ACTIVE,
        );
      }
    }
  }

  /**
   * Returns the allowed restriction actions for a given offering intensity.
   * @param offeringIntensity offering intensity to check.
   * @returns allowed restriction actions.
   */
  private getAllowedRestrictionActions(
    offeringIntensity: OfferingIntensity,
  ): RestrictionActionType[] {
    switch (offeringIntensity) {
      case OfferingIntensity.fullTime:
        return [
          RestrictionActionType.StopFullTimeBCLoan,
          RestrictionActionType.StopFullTimeBCGrants,
          RestrictionActionType.StopFullTimeDisbursement,
        ];
      case OfferingIntensity.partTime:
        return [
          RestrictionActionType.StopPartTimeBCGrants,
          RestrictionActionType.StopPartTimeDisbursement,
        ];
      default:
        throw new Error("Invalid offering intensity.");
    }
  }

  /**
   * Checks if there is an active application restriction bypass.
   * Throws an error if there is an active bypass for the same active student restriction id.
   * @param applicationId id of the application to check.
   * @param restrictionId id of the restriction to check.
   * @param restrictionType type of the restriction to check.
   */
  private async checkForActiveApplicationRestrictionBypasses(
    applicationId: number,
    restrictionId: number,
    restrictedParty: RestrictedParty,
  ): Promise<void> {
    const existsActiveRestrictionBypass = await this.checkIfActiveBypassExists(
      applicationId,
      restrictionId,
      restrictedParty,
    );
    if (existsActiveRestrictionBypass) {
      throw new CustomNamedError(
        "Cannot create a bypass when there is an active bypass for the same active restriction.",
        ACTIVE_BYPASS_FOR_RESTRICTED_PARTY_ALREADY_EXISTS,
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
          application: {
            id: true,
            student: { id: true },
            applicationStatus: true,
          },
        },
        relations: {
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
    if (
      INVALID_STATUSES_FOR_BYPASS_OPERATION.has(
        applicationRestrictionBypass.application.applicationStatus,
      )
    ) {
      throw new CustomNamedError(
        "Cannot remove a bypass when application is in invalid state.",
        APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_REMOVAL,
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
        isActive: true,
        studentRestriction: { id: studentRestrictionId },
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
        updatedAt: now,
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

  /**
   * Checks if there is an active application restriction bypass for the given application and restriction.
   * @param applicationId id of the application to check.
   * @param restrictionId id of the restriction to check.
   * @param restrictedParty the party that is restricted.
   * @returns true if there is an active bypass, false otherwise.
   */
  private async checkIfActiveBypassExists(
    applicationId: number,
    restrictionId: number,
    restrictedParty: RestrictedParty,
  ): Promise<boolean> {
    const studentRestrictionId =
      restrictedParty === RestrictedParty.Student ? restrictionId : undefined;
    const institutionRestrictionId =
      restrictedParty === RestrictedParty.Institution
        ? restrictionId
        : undefined;
    return this.applicationRestrictionBypassRepo.exists({
      where: {
        application: {
          id: applicationId,
        },
        studentRestriction: {
          id: studentRestrictionId,
        },
        institutionRestriction: {
          id: institutionRestrictionId,
        },
        isActive: true,
      },
    });
  }
}
