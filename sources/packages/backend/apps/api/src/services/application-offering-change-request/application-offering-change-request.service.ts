import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  ApplicationOfferingChangeRequest,
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  getUserFullNameLikeSearch,
  transformToApplicationEntitySortField,
} from "@sims/sims-db";
import { Brackets, Repository } from "typeorm";
import { PaginatedResults, PaginationOptions } from "../../utilities";

@Injectable()
export class ApplicationOfferingChangeRequestService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(ApplicationOfferingChangeRequest)
    private readonly applicationOfferingChangeRequestRepo: Repository<ApplicationOfferingChangeRequest>,
  ) {}

  /**
   * Gets a eligible application that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param options method options:
   * - `applicationId` specific eligible application to be retrieved.
   * @returns eligible application.
   */
  async getEligibleApplications(
    locationId: number,
    options: {
      applicationId?: number;
    },
  ): Promise<Application>;
  /**
   * Gets all eligible applications that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param options method options:
   * - `paginationOptions` options to execute the pagination.
   * @returns list of eligible applications that can be requested for
   * application offering change.
   */
  async getEligibleApplications(
    locationId: number,
    options: {
      pagination?: PaginationOptions;
    },
  ): Promise<PaginatedResults<Application>>;
  /**
   * Gets all eligible applications that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @returns list of eligible applications that can be requested for
   * application offering change.
   */
  async getEligibleApplications(
    locationId: number,
    options: {
      pagination?: PaginationOptions;
      applicationId?: number;
    },
  ): Promise<PaginatedResults<Application> | Application> {
    const applicationQuery = this.applicationRepo
      .createQueryBuilder("application")
      .select([
        "application.applicationNumber",
        "application.id",
        "programYear.id",
        "currentAssessment.id",
        "educationProgram.id",
        "offering.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.offeringIntensity",
        "student.id",
        "user.firstName",
        "user.lastName",
      ])
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.educationProgram", "educationProgram")
      .leftJoin(
        "application.applicationOfferingChangeRequest",
        "applicationOfferingChangeRequest",
      )
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
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

    if (options.applicationId) {
      applicationQuery.andWhere("application.id = :applicationId", {
        applicationId: options.applicationId,
      });
      // If searching by application id there is no need for pagination.
      return applicationQuery.getOne();
    }

    if (options.pagination?.searchCriteria?.trim()) {
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
          `%${options.pagination.searchCriteria}%`,
        );
    }

    applicationQuery
      .orderBy(
        transformToApplicationEntitySortField(
          options.pagination.sortField,
          options.pagination.sortOrder,
        ),
      )
      .offset(options.pagination.page * options.pagination.pageLimit)
      .limit(options.pagination.pageLimit);

    const [result, count] = await applicationQuery.getManyAndCount();
    return {
      results: result,
      count,
    };
  }

  /**
   * Gets application offering request change list.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @param statuses list of status that need to be included in the query.
   * @returns list of requested application offering changes.
   */
  async getSummaryByStatus(
    locationId: number,
    paginationOptions: PaginationOptions,
    statuses: ApplicationOfferingChangeRequestStatus[],
  ): Promise<PaginatedResults<ApplicationOfferingChangeRequest>> {
    const offeringChange = this.applicationOfferingChangeRequestRepo
      .createQueryBuilder("applicationOfferingChangeRequest")
      .select([
        "applicationOfferingChangeRequest.id",
        "applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus",
        "applicationOfferingChangeRequest.assessedDate",
        "applicationOfferingChangeRequest.studentActionDate",
        "application.applicationNumber",
        "currentAssessment.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "student.id",
        "user.firstName",
        "user.lastName",
      ])
      .innerJoin("applicationOfferingChangeRequest.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("application.location.id = :locationId", { locationId })
      .andWhere(
        "applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus IN (:...statuses)",
        {
          statuses,
        },
      );
    if (paginationOptions.searchCriteria?.trim()) {
      offeringChange
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
    offeringChange
      .orderBy(
        transformToApplicationEntitySortField(
          paginationOptions.sortField,
          paginationOptions.sortOrder,
        ),
      )
      .offset(paginationOptions.page * paginationOptions.pageLimit)
      .limit(paginationOptions.pageLimit);
    const [result, count] = await offeringChange.getManyAndCount();
    return {
      results: result,
      count,
    };
  }

  /**
   * Get the Application Offering Change Request by its id.
   * @param id the Application Offering Change Request id.
   * @param options method options:
   * - `locationId`: location for authorization.
   * @returns
   */
  async getById(
    id: number,
    options?: {
      locationId?: number;
    },
  ): Promise<ApplicationOfferingChangeRequest> {
    return this.applicationOfferingChangeRequestRepo.findOne({
      select: {
        id: true,
        reason: true,
        activeOffering: {
          id: true,
        },
        requestedOffering: {
          id: true,
          educationProgram: {
            id: true,
            name: true,
          },
        },
        application: {
          id: true,
          applicationNumber: true,
          location: {
            id: true,
            name: true,
          },
        },
        assessedNote: {
          id: true,
          description: true,
        },
      },
      relations: {
        application: { location: true },
      },
      where: {
        id,
        application: {
          location: { id: options.locationId },
        },
      },
    });
  }
}
