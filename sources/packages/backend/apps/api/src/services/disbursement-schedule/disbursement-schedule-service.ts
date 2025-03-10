import { Injectable } from "@nestjs/common";
import {
  PaginationOptions,
  PaginatedResults,
  OrderByCondition,
} from "../../utilities";
import { FieldSortOrder } from "@sims/utilities";
import { DataSource, Brackets } from "typeorm";
import {
  RecordDataModelService,
  ApplicationStatus,
  DisbursementSchedule,
  getUserFullNameLikeSearch,
} from "@sims/sims-db";
import {
  ConfirmationOfEnrollmentService,
  EnrollmentPeriod,
} from "@sims/services";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  constructor(
    dataSource: DataSource,
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
  ) {
    super(dataSource.getRepository(DisbursementSchedule));
  }

  /**
   * Get the list of disbursement schedules for a given location as COE.
   ** COE values are retrieved only when an application reaches enrollment status.
   ** When the first COE is approved, application moves to complete status as per workflow but second COE is still
   ** waiting to be approved by institution.
   * @param locationId location id.
   * @param enrolmentPeriod enrolment period.
   * @param paginationOptions pagination options.
   * @returns List of COE for given location.
   */
  async getCOEByLocation(
    locationId: number,
    enrolmentPeriod: EnrollmentPeriod,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<DisbursementSchedule>> {
    const disbursementCOEQuery =
      this.confirmationOfEnrollmentService.getDisbursementForCOEQuery(
        this.repo,
        enrolmentPeriod,
      );
    disbursementCOEQuery.andWhere("location.id = :locationId", { locationId });
    // Add pagination, sort and search criteria.
    if (paginationOptions.searchCriteria) {
      disbursementCOEQuery
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
    disbursementCOEQuery
      .orderBy(
        this.transformToEntitySortField(
          paginationOptions.sortField,
          paginationOptions.sortOrder,
        ),
      )
      .offset(paginationOptions.page * paginationOptions.pageLimit)
      .limit(paginationOptions.pageLimit);
    const [result, count] = await disbursementCOEQuery.getManyAndCount();
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
        "application.data",
        "currentAssessment.id",
        "location.name",
        "location.id",
        "student.id",
        "student.disabilityStatus",
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
      .andWhere("disbursement.hasEstimatedAwards = true")
      .getOne();
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
}
