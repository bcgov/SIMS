import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  getUserFullNameLikeSearch,
  transformToEntitySortField,
} from "@sims/sims-db";
import { Brackets, Repository } from "typeorm";
import { PaginatedResults, PaginationOptions } from "../../utilities";

@Injectable()
export class ApplicationOfferingChangeRequestService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  /**
   * Gets all eligible applications that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @returns list of eligible applications that can be requested for
   * application offering change.
   */
  async getEligibleApplicationOfferingChangeRecords(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<Application>> {
    const applicationQuery = this.applicationRepo
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
      ])
      .leftJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("currentAssessment.offering", "offering")
      .leftJoin(
        "application.applicationOfferingChangeRequest",
        "applicationOfferingChangeRequest",
      )
      .leftJoin("application.student", "student")
      .leftJoin("student.user", "user")
      .where(
        new Brackets((qb) =>
          qb
            .where("applicationOfferingChangeRequest.id IS NULL")
            .orWhere(
              "applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus NOT IN (:...status)",
              {
                status: [
                  ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
                  ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
                ],
              },
            ),
        ),
      )
      .andWhere("application.location.id = :locationId", { locationId })
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.Completed,
      })
      .andWhere("application.isArchived = false");

    if (paginationOptions.searchCriteria?.trim()) {
      applicationQuery
        .andWhere(
          new Brackets((qb) => {
            qb.where(getUserFullNameLikeSearch()).orWhere(
              "application.applicationNumber Ilike :searchCriteria",
            );
          }),
        )
        .setParameter(
          "searchCriteria",
          `%${paginationOptions.searchCriteria}%`,
        );
    }

    applicationQuery
      .orderBy(
        transformToEntitySortField(
          paginationOptions.sortField,
          paginationOptions.sortOrder,
        ),
      )
      .offset(paginationOptions.page * paginationOptions.pageLimit)
      .limit(paginationOptions.pageLimit);
    const [result, count] = await applicationQuery.getManyAndCount();
    return {
      results: result,
      count,
    };
  }
}
