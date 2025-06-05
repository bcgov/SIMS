import { Injectable } from "@nestjs/common";
import { NotificationActionsService } from "@sims/services/notifications";
import {
  Application,
  RecordDataModelService,
  Restriction,
  RestrictionNotificationType,
  Student,
  StudentRestriction,
  User,
} from "@sims/sims-db";
import {
  DataSource,
  EntityManager,
  In,
  Not,
  SelectQueryBuilder,
} from "typeorm";
import { RestrictionCode } from "./model/restriction.model";
import { RestrictionSharedService } from "./restriction-shared.service";
export const RESTRICTION_NOT_ACTIVE = "RESTRICTION_NOT_ACTIVE";
export const RESTRICTION_NOT_PROVINCIAL = "RESTRICTION_NOT_PROVINCIAL";
/**
 * While performing a possible huge amount of select,
 * breaks the execution in chunks.
 */
const NOTIFICATIONS_SELECT_CHUNK_SIZE = 1000;

/**
 * Service layer for Student Restriction.
 */
@Injectable()
export class StudentRestrictionSharedService extends RecordDataModelService<StudentRestriction> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly restrictionSharedService: RestrictionSharedService,
  ) {
    super(dataSource.getRepository(StudentRestriction));
  }

  /**
   * Creates a 'select' query that could be used in an 'exists' or
   * 'not exists' where clause to define if the student has some
   * active restrictions that must prevent him for certain
   * critical operations, for instance, to have money disbursed.
   * ! This query will assume that a join to 'student.id' is present
   * ! in the master query.
   * ! This query is expecting the consumer function to set restrictionActions
   * ! parameter.
   * @param checkAll is by default false, checkAll decides if all the
   * elements in the restrictionActions should be checked (i.e checkAll = true)
   * or any one of the elements is to be checked (i.e checkAll = false).
   * @param isStudentId is flag that will allow consumer function to set
   * student id as parameter, by default its false.
   * @param restrictionActionVariable is the parameter name, can be overridden
   * from default 'restrictionActions' to use another set of restrictions in
   * same query.
   * @returns 'select' query that could be used in an 'exists' or
   * 'not exists'.
   */
  getExistsBlockRestrictionQuery(
    checkAll = false,
    isStudentId = false,
    restrictionActionVariable = "restrictionActions",
  ): SelectQueryBuilder<StudentRestriction> {
    const query = this.repo
      .createQueryBuilder("studentRestrictions")
      .select("1")
      .innerJoin("studentRestrictions.restriction", "restrictions")
      .innerJoin("studentRestrictions.student", "restrictionStudent")
      .where("studentRestrictions.isActive = true");
    if (isStudentId) {
      query.andWhere("restrictionStudent.id = :studentId");
    } else {
      query.andWhere("restrictionStudent.id = student.id");
    }

    if (checkAll) {
      query.andWhere(
        `restrictions.actionType @> :${restrictionActionVariable}`,
      );
    } else {
      query.andWhere(
        `restrictions.actionType && :${restrictionActionVariable}`,
      );
    }
    query.limit(1);
    return query;
  }

  /**
   * Gets the notifications information for student restrictions that are
   * eligible to generate a notification.
   * @param restrictionIds student restriction ids.
   * @param entityManager optional repository that can be provided, for instance,
   * to execute the command as part of an existing transaction. If not provided
   * the local repository will be used instead.
   * @returns student restrictions eligible to generate a notification.
   */
  private async getRestrictionsForNotifications(
    restrictionIds: number[],
    entityManager?: EntityManager,
  ): Promise<StudentRestriction[]> {
    const repository =
      entityManager?.getRepository(StudentRestriction) ?? this.repo;
    // Copy the input array to avoid changing the one received by parameter.
    const idsToProcess = [...restrictionIds];
    // Restrictions to be returned and must have a notification created.
    const allRestrictions: StudentRestriction[] = [];
    while (idsToProcess.length > 0) {
      // Breaks the execution in chunks to allow the selects of a huge amount of records.
      // The query will fail over a 65535 parameters. Even not being the expected amount of records,
      // the code will be able to process this amount under an unusual circumstance.
      const ids = idsToProcess.splice(0, NOTIFICATIONS_SELECT_CHUNK_SIZE);
      const restrictions = await repository.find({
        select: {
          id: true,
          student: {
            id: true,
            user: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        relations: {
          student: { user: true },
        },
        where: {
          id: In(ids),
          restriction: {
            notificationType: Not(RestrictionNotificationType.NoEffect),
          },
        },
      });
      allRestrictions.push(...restrictions);
    }

    return allRestrictions;
  }

  /**
   * Create notifications for newly created student restrictions when needed.
   * @param restrictionsIds ids to generate the notifications.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager entity manager to execute in transaction.
   */
  async createNotifications(
    restrictionsIds: number[],
    auditUserId: number,
    entityManager?: EntityManager,
  ): Promise<void> {
    const restrictions = await this.getRestrictionsForNotifications(
      restrictionsIds,
      entityManager,
    );

    if (!restrictions?.length) {
      // There are no notifications to be sent.
      return;
    }

    const notifications = restrictions.map((restriction) => ({
      givenNames: restriction.student.user.firstName,
      lastName: restriction.student.user.lastName,
      toAddress: restriction.student.user.email,
      userId: restriction.student.user.id,
    }));
    await this.notificationActionsService.saveStudentRestrictionAddedNotification(
      notifications,
      auditUserId,
      entityManager,
    );
  }

  /**
   * Create a new student restriction object.
   * @param studentId student id.
   * @param restrictionCode restriction code.
   * @param auditUserId audit user id
   * @param applicationId application id.
   * @param entityManager entity manager to execute in transaction.
   * @returns a new student restriction object.
   */
  async createRestrictionToSave(
    studentId: number,
    restrictionCode: RestrictionCode,
    auditUserId: number,
    applicationId: number,
    entityManager?: EntityManager,
  ): Promise<StudentRestriction> {
    const restriction =
      await this.restrictionSharedService.getRestrictionByCode(
        restrictionCode,
        entityManager,
      );
    if (!restriction) {
      throw new Error(
        `Requested restriction code ${restrictionCode} not found.`,
      );
    }
    const studentRestriction = new StudentRestriction();
    studentRestriction.restriction = {
      id: restriction.id,
    } as Restriction;
    studentRestriction.student = { id: studentId } as Student;
    studentRestriction.application = { id: applicationId } as Application;
    studentRestriction.creator = { id: auditUserId } as User;
    return studentRestriction;
  }
}
