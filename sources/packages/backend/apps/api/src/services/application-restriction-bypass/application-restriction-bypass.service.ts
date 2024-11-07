import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  ApplicationRestrictionBypass,
  ApplicationStatus,
  Note,
  NoteType,
  OfferingIntensity,
  RecordDataModelService,
  RestrictionActionType,
  StudentRestriction,
  User,
} from "@sims/sims-db";
import {
  BypassRestrictionAPIInDTO,
  RemoveBypassRestrictionAPIInDTO,
} from "../../route-controllers/application-restriction-bypass/models/application-restriction-bypass.dto";
import {
  Brackets,
  DataSource,
  EntityManager,
  In,
  Not,
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

/**
 * Service layer for application restriction bypasses.
 */
@Injectable()
export class ApplicationRestrictionBypassService extends RecordDataModelService<ApplicationRestrictionBypass> {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StudentRestriction)
    private readonly studentRestrictionRepo: Repository<StudentRestriction>,
  ) {
    super(dataSource.getRepository(ApplicationRestrictionBypass));
  }

  /**
   * Returns all application restriction bypasses for a given application.
   * @param applicationId id of the application to retrieve restriction bypasses.
   * @returns application restriction bypasses.
   */
  async getApplicationRestrictionBypasses(
    applicationId: number,
  ): Promise<ApplicationRestrictionBypass[]> {
    return this.repo.find({
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
  getApplicationRestrictionBypass(
    id: number,
  ): Promise<ApplicationRestrictionBypass> {
    return this.repo.findOne({
      select: {
        id: true,
        isActive: true,
        studentRestriction: {
          id: true,
          restriction: {
            restrictionCode: true,
          },
        },
        creationNote: true as unknown,
        removalNote: true as unknown,
        bypassCreatedBy: true as unknown,
        bypassCreatedDate: true,
        bypassRemovedBy: true as unknown,
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
        application: {
          applicationStatus: Not(
            In([
              ApplicationStatus.Draft,
              ApplicationStatus.Cancelled,
              ApplicationStatus.Overwritten,
            ]),
          ),
        },
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
              qb.where("offering.offeringIntensity = :fullTimeIntensity", {
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
                )
                .orWhere("offering.offeringIntensity = :partTimeIntensity", {
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
        return `EXISTS (${actionTypeSubQuery.getQuery()})`;
      })
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
    payload: BypassRestrictionAPIInDTO,
    auditUserId: number,
  ): Promise<ApplicationRestrictionBypass> {
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        await this.checkForActiveApplicationStudentRestrictionByPasses(
          transactionalEntityManager,
          payload.applicationId,
          payload.studentRestrictionId,
        );
        await this.checkForActiveStudentRestriction(
          transactionalEntityManager,
          payload.studentRestrictionId,
        );
        await this.checkForApplicationInValidState(
          transactionalEntityManager,
          payload.applicationId,
        );

        const notes = new Note();
        notes.description = payload.note;
        notes.noteType = NoteType.Application;
        notes.creator = auditUser;
        notes.createdAt = now;
        const noteObj = await transactionalEntityManager
          .getRepository(Note)
          .save(notes);

        return await transactionalEntityManager
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
   * @param transactionalEntityManager transactional entity manager to execute the query.
   * @param applicationId id of the application to check.
   */
  private async checkForApplicationInValidState(
    transactionalEntityManager: EntityManager,
    applicationId: number,
  ) {
    const application = await transactionalEntityManager
      .getRepository(Application)
      .findOne({
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
   * @param transactionalEntityManager transactional entity manager to execute the query.
   * @param studentRestrictionId id of the student restriction to check.
   */
  private async checkForActiveStudentRestriction(
    transactionalEntityManager: EntityManager,
    studentRestrictionId: number,
  ) {
    const studentRestriction = await transactionalEntityManager
      .getRepository(StudentRestriction)
      .findOne({
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
   * @param transactionalEntityManager transactional entity manager to execute the query.
   * @param applicationId id of the application to check.
   * @param studentRestrictionId id of the student restriction to check.
   */
  private async checkForActiveApplicationStudentRestrictionByPasses(
    transactionalEntityManager: EntityManager,
    applicationId: number,
    studentRestrictionId: number,
  ) {
    const existsActiveStudentRestriction = await transactionalEntityManager
      .getRepository(ApplicationRestrictionBypass)
      .exists({
        relations: { studentRestriction: true },
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
        "There is an active bypass for the same active student restriction id.",
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
    payload: RemoveBypassRestrictionAPIInDTO,
    auditUserId: number,
  ): Promise<UpdateResult> {
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const applicationRestrictionBypass = await transactionalEntityManager
          .getRepository(ApplicationRestrictionBypass)
          .findOne({
            select: {
              id: true,
              isActive: true,
              studentRestriction: {
                isActive: true,
              },
              application: {
                id: true,
                applicationStatus: true,
              },
            },
            relations: { studentRestriction: true, application: true },
            where: {
              id,
            },
          });
        if (!applicationRestrictionBypass) {
          throw new CustomNamedError(
            "Could not find application restriction bypass for the given id.",
            APPLICATION_RESTRICTION_BYPASS_NOT_FOUND,
          );
        }
        if (
          applicationRestrictionBypass.studentRestriction.isActive === false
        ) {
          throw new CustomNamedError(
            "Cannot create a bypass when student restriction is not active.",
            STUDENT_RESTRICTION_IS_NOT_ACTIVE,
          );
        }
        if (applicationRestrictionBypass.isActive !== true) {
          throw new CustomNamedError(
            "Application restriction bypass is not active.",
            APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE,
          );
        }

        const notes = new Note();
        notes.description = payload.note;
        notes.noteType = NoteType.Application;
        notes.creator = auditUser;
        notes.createdAt = now;
        const noteObj = await transactionalEntityManager
          .getRepository(Note)
          .save(notes);

        return await transactionalEntityManager
          .getRepository(ApplicationRestrictionBypass)
          .update(
            { id },
            {
              isActive: false,
              bypassRemovedDate: new Date(),
              bypassRemovedBy: { id: auditUserId } as User,
              removalNote: noteObj,
              modifier: auditUser,
            },
          );
      },
    );
  }
}
