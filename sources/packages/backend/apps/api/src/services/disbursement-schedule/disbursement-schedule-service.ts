import { Injectable } from "@nestjs/common";
import {
  COE_WINDOW,
  COE_DENIED_REASON_OTHER_ID,
  PaginationOptions,
  PaginatedResults,
  OrderByCondition,
} from "../../utilities";
import {
  addDays,
  getISODateOnlyString,
  isBetweenPeriod,
  isBeforeDate,
  FieldSortOrder,
} from "@sims/utilities";
import { DataSource, UpdateResult, Brackets, EntityManager } from "typeorm";
import { SequenceControlService } from "@sims/services";
import {
  RecordDataModelService,
  Application,
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  User,
  getUserFullNameLikeSearch,
} from "@sims/sims-db";
import { NotificationActionsService } from "@sims/services/notifications";
import {
  COEApprovalPeriodStatus,
  EnrollmentPeriod,
} from "./disbursement-schedule.models";

const DISBURSEMENT_DOCUMENT_NUMBER_SEQUENCE_GROUP =
  "DISBURSEMENT_DOCUMENT_NUMBER";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly sequenceService: SequenceControlService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super(dataSource.getRepository(DisbursementSchedule));
  }

  /**
   * Generates the next document number to be associated
   * with a disbursement.
   */
  private async getNextDocumentNumber(): Promise<number> {
    let nextDocumentNumber: number;
    await this.sequenceService.consumeNextSequence(
      DISBURSEMENT_DOCUMENT_NUMBER_SEQUENCE_GROUP,
      async (nextSequenceNumber) => {
        nextDocumentNumber = nextSequenceNumber;
      },
    );
    return nextDocumentNumber;
  }

  /**
   * On COE Approval, update disbursement schedule with document number and
   * COE related columns. Update the Application status to completed, if it is first COE.
   * The update to Application and Disbursement schedule happens in single transaction.
   * @param disbursementScheduleId disbursement schedule Id.
   * @param userId User updating the confirmation of enrollment.
   * @param applicationId application Id.
   * @param applicationStatus application status of the disbursed application.
   * @param tuitionRemittanceRequestedAmount tuition remittance amount requested by the institution.
   */
  async updateDisbursementAndApplicationCOEApproval(
    disbursementScheduleId: number,
    userId: number,
    applicationId: number,
    applicationStatus: ApplicationStatus,
    tuitionRemittanceRequestedAmount: number,
  ): Promise<void> {
    const documentNumber = await this.getNextDocumentNumber();
    const auditUser = { id: userId } as User;
    const now = new Date();

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager
        .getRepository(DisbursementSchedule)
        .createQueryBuilder()
        .update(DisbursementSchedule)
        .set({
          documentNumber: documentNumber,
          coeStatus: COEStatus.completed,
          coeUpdatedBy: auditUser,
          coeUpdatedAt: now,
          modifier: auditUser,
          updatedAt: now,
          tuitionRemittanceRequestedAmount: tuitionRemittanceRequestedAmount,
        })
        .where("id = :disbursementScheduleId", { disbursementScheduleId })
        .execute();

      if (applicationStatus === ApplicationStatus.Enrolment) {
        await transactionalEntityManager
          .getRepository(Application)
          .createQueryBuilder()
          .update(Application)
          .set({
            applicationStatus: ApplicationStatus.Completed,
            modifier: auditUser,
            updatedAt: now,
          })
          .where("id = :applicationId", { applicationId })
          .execute();
      }
      // Create a student notification when COE is confirmed.
      await this.createNotificationForDisbursementUpdate(
        disbursementScheduleId,
        userId,
        transactionalEntityManager,
      );
    });
  }

  /**
   * Get the list of disbursement schedules for a given location as COE.
   ** COE values are retrieved only when an application reaches enrollment status.
   ** When the first COE is approved, application moves to complete status as per workflow but second COE is still
   ** waiting to be approved by institution.
   * @param locationId
   * @param enrollmentPeriod
   * @param paginationOptions
   * @returns List of COE for given location.
   */
  async getCOEByLocation(
    locationId: number,
    enrollmentPeriod: EnrollmentPeriod,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<DisbursementSchedule>> {
    const coeThresholdDate = addDays(COE_WINDOW);
    const coeQuery = this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.disbursementDate",
        "disbursementSchedule.coeStatus",
        "application.applicationNumber",
        "application.id",
        "studentAssessment.id",
        "currentAssessment.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "student.id",
        "user.firstName",
        "user.lastName",
      ])
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "location")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("studentAssessment.id = currentAssessment.id")
      .andWhere("location.id = :locationId", { locationId })
      .andWhere("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.Enrolment, ApplicationStatus.Completed],
      });
    if (enrollmentPeriod === EnrollmentPeriod.Upcoming) {
      coeQuery.andWhere(
        new Brackets((qb) => {
          qb.where(
            "disbursementSchedule.disbursementDate > :coeThresholdDate",
          ).orWhere("disbursementSchedule.coeStatus != :required", {
            required: COEStatus.required,
          });
        }),
      );
    } else {
      coeQuery
        .andWhere("disbursementSchedule.disbursementDate <= :coeThresholdDate")
        .andWhere("disbursementSchedule.coeStatus = :required", {
          required: COEStatus.required,
        });
    }
    coeQuery.setParameter("coeThresholdDate", coeThresholdDate);
    if (paginationOptions.searchCriteria) {
      coeQuery
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
    coeQuery
      .orderBy(
        this.transformToEntitySortField(
          paginationOptions.sortField,
          paginationOptions.sortOrder,
        ),
      )
      .offset(paginationOptions.page * paginationOptions.pageLimit)
      .limit(paginationOptions.pageLimit);
    const [result, count] = await coeQuery.getManyAndCount();
    return {
      results: result,
      count: count,
    };
  }

  /**
   * Returns Disbursement and application details for COE detail view.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param locationId location id.
   * @returns Disbursement and Application details.
   */
  async getDisbursementAndApplicationDetails(
    locationId: number,
    disbursementScheduleId: number,
  ): Promise<DisbursementSchedule> {
    return this.repo
      .createQueryBuilder("disbursement")
      .select([
        "disbursement.id",
        "disbursement.disbursementDate",
        "disbursement.coeStatus",
        "disbursement.coeDeniedOtherDesc",
        "studentAssessment.id",
        "application.applicationNumber",
        "application.applicationStatus",
        "application.id",
        "application.pirStatus",
        "currentAssessment.id",
        "location.name",
        "location.id",
        "student.id",
        "user.firstName",
        "user.lastName",
        "offering.name",
        "offering.offeringIntensity",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.lacksStudyBreaks",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.mandatoryFees",
        "offering.exceptionalExpenses",
        "offering.offeringDelivered",
        "offering.studyBreaks",
        "program.name",
        "program.description",
        "program.credentialType",
        "program.deliveredOnline",
        "program.deliveredOnSite",
        "coeDeniedReason.id",
        "coeDeniedReason.reason",
      ])
      .innerJoin("disbursement.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "location")
      .innerJoin("offering.educationProgram", "program")
      .leftJoin("disbursement.coeDeniedReason", "coeDeniedReason")
      .where("location.id = :locationId", { locationId })
      .andWhere("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.Enrolment, ApplicationStatus.Completed],
      })
      .andWhere("disbursement.id = :disbursementScheduleId", {
        disbursementScheduleId,
      })
      .getOne();
  }

  /**
   * Summary of disbursement and application for Approval/Denial of COE.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param locationId location id.
   * @returns disbursement and application summary.
   */
  async getDisbursementAndApplicationSummary(
    disbursementScheduleId: number,
    locationId?: number,
  ): Promise<DisbursementSchedule> {
    const disbursementAndApplicationQuery = this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.disbursementDate",
        "application.id",
        "application.applicationStatus",
        "studentAssessment.id",
        "studentAssessment.assessmentWorkflowId",
        "currentAssessment.id",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.studyEndDate",
        "disbursementValues.valueType",
        "disbursementValues.valueCode",
        "disbursementValues.valueAmount",
      ])
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin(
        "disbursementSchedule.disbursementValues",
        "disbursementValues",
      )
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "location")
      .where("disbursementSchedule.id = :disbursementScheduleId", {
        disbursementScheduleId,
      })
      .andWhere("disbursementSchedule.coeStatus = :required", {
        required: COEStatus.required,
      })
      .andWhere("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.Enrolment, ApplicationStatus.Completed],
      });

    if (locationId) {
      disbursementAndApplicationQuery.andWhere("location.id = :locationId", {
        locationId,
      });
    }
    return disbursementAndApplicationQuery.getOne();
  }

  /**
   * Deny COE for a disbursement schedule.
   ** Note: If an application has 2 COEs, and if the first COE is rejected then 2nd COE is implicitly rejected.
   * @param disbursementScheduleId disbursement schedule id to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param coeDeniedReasonId denied reason id of a denied COE.
   * @param otherReasonDesc result of the update operation.
   */
  async updateCOEToDenied(
    disbursementScheduleId: number,
    auditUserId: number,
    coeDeniedReasonId: number,
    otherReasonDesc: string,
  ): Promise<UpdateResult> {
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const updateResult = await transactionalEntityManager
          .getRepository(DisbursementSchedule)
          .createQueryBuilder()
          .update(DisbursementSchedule)
          .set({
            coeStatus: COEStatus.declined,
            coeUpdatedBy: auditUser,
            coeUpdatedAt: now,
            coeDeniedReason: { id: coeDeniedReasonId },
            coeDeniedOtherDesc:
              coeDeniedReasonId === COE_DENIED_REASON_OTHER_ID
                ? otherReasonDesc
                : null,
            modifier: auditUser,
            updatedAt: now,
          })
          .where("id = :disbursementScheduleId", { disbursementScheduleId })
          .andWhere("coeStatus = :required", { required: COEStatus.required })
          .execute();

        if (updateResult.affected !== 1) {
          throw new Error(
            `While updating COE status to '${COEStatus.declined}' the number of affected row was bigger than the expected one. Expected 1 received ${updateResult.affected}`,
          );
        }

        // Create a student notification when COE is confirmed.
        await this.createNotificationForDisbursementUpdate(
          disbursementScheduleId,
          auditUserId,
          transactionalEntityManager,
        );

        return updateResult;
      },
    );
  }

  /**
   * Get the first disbursement schedule of a disbursement.
   * @param options options to execute the search. If onlyPendingCOE is true,
   * only records with coeStatus defined as 'Required' will be considered.
   * @returns first disbursement schedule, if any.
   */
  async getFirstDisbursementScheduleByApplication(
    applicationId: number,
    onlyPendingCOE?: boolean,
  ): Promise<DisbursementSchedule> {
    const query = this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.coeStatus",
        "disbursementSchedule.coeDeniedOtherDesc",
        "coeDeniedReason.id",
        "coeDeniedReason.reason",
        "studentAssessment.id",
        "application.id",
        "application.applicationStatus",
      ])
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("disbursementSchedule.coeDeniedReason", "coeDeniedReason")
      .where("studentAssessment.id = currentAssessment.id")
      .andWhere("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.Enrolment, ApplicationStatus.Completed],
      })
      .andWhere("application.id = :applicationId", {
        applicationId: applicationId,
      });

    if (onlyPendingCOE) {
      query.andWhere("disbursementSchedule.coeStatus = :required", {
        required: COEStatus.required,
      });
    }

    query.orderBy("disbursementSchedule.disbursementDate").limit(1);
    return query.getOne();
  }

  /**
   **Transformation to convert the data table column name to database column name
   **Any changes to the data object (e.g data table) in presentation layer must be adjusted here.
   * @param sortField
   * @param sortOrder
   * @returns OrderByCondition
   */
  private transformToEntitySortField(
    sortField: string,
    sortOrder: FieldSortOrder,
  ): OrderByCondition {
    const orderByCondition = {};
    if (sortField === "fullName") {
      orderByCondition["user.firstName"] = sortOrder;
      orderByCondition["user.lastName"] = sortOrder;
      return orderByCondition;
    }

    const coeSortOptions = {
      applicationNumber: "application.applicationNumber",
      disbursementDate: "disbursementSchedule.disbursementDate",
    };
    const dbColumnName =
      coeSortOptions[sortField] || "disbursementSchedule.coeStatus";
    orderByCondition[dbColumnName] = sortOrder;
    return orderByCondition;
  }

  /**
   * Create institution confirm COE notification to notify student
   * when institution confirms a COE to their application.
   * @param disbursementScheduleId updated disbursement schedule.
   * @param auditUserId user who creates notification.
   * @param transactionalEntityManager entity manager to execute in transaction.
   */
  async createNotificationForDisbursementUpdate(
    disbursementScheduleId: number,
    auditUserId: number,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    const disbursement = await transactionalEntityManager
      .getRepository(DisbursementSchedule)
      .findOne({
        select: {
          id: true,
          studentAssessment: {
            id: true,
            application: {
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
          },
        },
        relations: {
          studentAssessment: { application: { student: { user: true } } },
        },
        where: { id: disbursementScheduleId },
      });

    const studentUser = disbursement.studentAssessment.application.student.user;
    await this.notificationActionsService.saveInstitutionCompletesCOENotification(
      {
        givenNames: studentUser.firstName,
        lastName: studentUser.lastName,
        toAddress: studentUser.email,
        userId: studentUser.id,
      },
      auditUserId,
      transactionalEntityManager,
    );
  }

  /**
   * Get COE approval period status which defines
   * if the COE can be confirmed by institution on current date.
   * @param disbursementDate disbursement date.
   * @param studyEndDate study end date of the offering.
   * @returns COE approval period status.
   */
  getCOEApprovalPeriodStatus(
    disbursementDate: string | Date,
    studyEndDate: string | Date,
  ): COEApprovalPeriodStatus {
    if (!disbursementDate || !studyEndDate) {
      throw new Error(
        "disbursementDate and studyEndDate are required for COE window verification.",
      );
    }
    // Enrolment period start date(COE_WINDOW days before disbursement date).
    const enrolmentPeriodStart = addDays(-COE_WINDOW, disbursementDate);
    //Current date as date only string.
    const now = getISODateOnlyString(new Date());
    // Enrolment period end date is study period end date.
    // Is the enrolment now within eligible approval period.
    if (
      isBetweenPeriod(now, {
        startDate: enrolmentPeriodStart,
        endDate: studyEndDate,
      })
    ) {
      return COEApprovalPeriodStatus.WithinApprovalPeriod;
    }
    // Is the enrolment now before the eligible approval period.
    if (isBeforeDate(now, enrolmentPeriodStart)) {
      return COEApprovalPeriodStatus.BeforeApprovalPeriod;
    }

    return COEApprovalPeriodStatus.AfterApprovalPeriod;
  }
}
