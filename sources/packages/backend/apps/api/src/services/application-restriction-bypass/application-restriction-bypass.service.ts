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
import { Brackets, DataSource, Not, Repository, UpdateResult } from "typeorm";
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
  BypassRestrictionData,
  RemoveBypassRestrictionData,
} from "apps/api/src/services/application-restriction-bypass/application-restriction-bypass.models";
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
          applicationStatus: Not(ApplicationStatus.Draft),
        },
      },
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
    });
  }

  /**
   * Gets all available student restrictions to bypass for a given application.
   * @param applicationId application id.
   * @returns list of application restriction bypass options.
   */
  async getAvailableStudentRestrictionsToBypass(
    applicationId: number,
  ): Promise<StudentRestriction[]> {
    return await this.studentRestrictionRepo
      .createQueryBuilder("studentRestriction")
      .select([
        "studentRestriction.id",
        "restriction.restrictionCode",
        "studentRestriction.createdAt",
      ])
      .innerJoin("studentRestriction.restriction", "restriction")
      .innerJoin("studentRestriction.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .where("studentRestriction.application = :applicationId", {
        applicationId,
      })
      // Active application restriction bypass.
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select("applicationRestrictionBypass.id")
          .from(ApplicationRestrictionBypass, "applicationRestrictionBypass")
          .where("applicationRestrictionBypass.application = :applicationId", {
            applicationId,
          })
          .andWhere(
            "applicationRestrictionBypass.studentRestriction = studentRestriction.id",
          )
          .andWhere("applicationRestrictionBypass.isActive = true");
        return `NOT EXISTS (${subQuery.getQuery()})`;
      })
      // Restriction action type condition.
      .andWhere((qb) => {
        const actionTypeSubQuery = qb
          .subQuery()
          .select("1")
          .from(Application, "application")
          .innerJoin("application.currentAssessment", "currentAssessment")
          .innerJoin("currentAssessment.offering", "offering")
          .where("application.id = :applicationId", { applicationId })
          .andWhere(
            new Brackets((qb) => {
              qb.where(
                new Brackets((fullTimeQb) => {
                  fullTimeQb
                    .where("offering.offeringIntensity = :fullTimeIntensity", {
                      fullTimeIntensity: OfferingIntensity.fullTime,
                    })
                    .andWhere(
                      "restriction.action_type::text[] && ARRAY[:...fullTimeActionTypes]::text[]",
                      {
                        fullTimeActionTypes: [
                          RestrictionActionType.StopFullTimeBCFunding,
                          RestrictionActionType.StopFullTimeDisbursement,
                        ],
                      },
                    );
                }),
              ).orWhere(
                new Brackets((partTimeQb) => {
                  partTimeQb
                    .where("offering.offeringIntensity = :partTimeIntensity", {
                      partTimeIntensity: OfferingIntensity.partTime,
                    })
                    .andWhere(
                      "restriction.action_type::text[] && ARRAY[:...partTimeActionTypes]::text[]",
                      {
                        partTimeActionTypes: [
                          RestrictionActionType.StopPartTimeDisbursement,
                        ],
                      },
                    );
                }),
              );
            }),
          );
        return `EXISTS (${actionTypeSubQuery.getQuery()})`;
      })
      .andWhere("studentRestriction.isActive = true")
      .orderBy("restriction.restrictionCode", "ASC")
      .getMany();
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
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
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
      },
    );
  }

  /**
   * Checks if the application is in a valid state for bypass creation.
   * Throws an error if the application is in a Draft, Cancelled,
   * or Overwritten state.
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
        ApplicationStatus.Overwritten,
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
   * @param payload note for the removal of the application restriction bypass.
   * @param auditUserId id of the audit user.
   * @returns updated application restriction bypass.
   */
  async removeBypassRestriction(
    id: number,
    payload: RemoveBypassRestrictionData,
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
    if (applicationRestrictionBypass.studentRestriction.isActive === false) {
      throw new CustomNamedError(
        "Cannot create a bypass when student restriction is not active.",
        STUDENT_RESTRICTION_IS_NOT_ACTIVE,
      );
    }
    if (applicationRestrictionBypass.isActive !== true) {
      throw new CustomNamedError(
        "Cannot remove a bypass when application restriction bypass is not active.",
        APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE,
      );
    }
    const auditUser = { id: auditUserId } as User;
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const noteObj = await this.noteSharedService.createStudentNote(
          applicationRestrictionBypass.application.student.id,
          NoteType.Application,
          payload.note,
          auditUserId,
          transactionalEntityManager,
        );
        return transactionalEntityManager
          .getRepository(ApplicationRestrictionBypass)
          .update(
            { id },
            {
              isActive: false,
              bypassRemovedDate: new Date(),
              bypassRemovedBy: auditUser,
              removalNote: noteObj,
              modifier: auditUser,
            },
          );
      },
    );
  }
}
