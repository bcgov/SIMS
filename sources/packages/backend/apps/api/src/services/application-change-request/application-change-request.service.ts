import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Application } from "@sims/sims-db";
import { Repository, Brackets, SelectQueryBuilder } from "typeorm";
import { ApplicationChangeRequestPaginationOptionsAPIInDTO } from "../../route-controllers/models/pagination.dto";
import { PaginatedResults } from "../../utilities";
import { FieldSortOrder } from "@sims/utilities";

/**
 * Service responsible for application change request operations.
 */
@Injectable()
export class ApplicationChangeRequestService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  /**
   * Gets applications based purely on their edit status.
   * @param targetStatus The application edit status to filter.
   * @param paginationOptions Pagination, sorting, and search options from the controller.
   * @returns Paginated list of applications.
   */
  async getApplicationsByEditStatus(
    applicationEditStatus,
    paginationOptions: ApplicationChangeRequestPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResults<Application>> {
    const { page, pageLimit, sortField, sortOrder, searchCriteria } =
      paginationOptions;

    const query = this.applicationRepo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "application.applicationNumber",
        "application.submittedDate",
        "student.id",
        "user.firstName",
        "user.lastName",
        "precedingApplication.id",
      ])
      .innerJoin("application.student", "student")
      .innerJoin("application.precedingApplication", "precedingApplication")
      .innerJoin("student.user", "user")
      .where("application.applicationEditStatus = :applicationEditStatus", {
        applicationEditStatus,
      });

    if (searchCriteria) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where("user.firstName ILIKE :searchQueryParam")
            .orWhere("user.lastName ILIKE :searchQueryParam")
            .orWhere("application.applicationNumber ILIKE :searchQueryParam");
        }),
      );
      query.setParameter("searchQueryParam", `%${searchCriteria.trim()}%`);
    }

    this.addApplicationChangeRequestSort(query, sortField, sortOrder);

    query.offset(page * pageLimit);
    query.limit(pageLimit);

    const [results, count] = await query.getManyAndCount();
    return { results, count };
  }

  /**
   * Adds sorting to the application change request query.
   * @param query Query builder.
   * @param sortField Field to be sorted.
   * @param sortOrder Sort order (ASC/DESC).
   */
  private addApplicationChangeRequestSort(
    query: SelectQueryBuilder<Application>,
    sortField?: string,
    sortOrder?: FieldSortOrder,
  ): void {
    let dbSortField: string;
    switch (sortField) {
      case "submittedDate":
        dbSortField = "application.createdAt";
        break;
      case "lastName":
        dbSortField = "user.lastName";
        break;
      case "applicationNumber":
        dbSortField = "application.applicationNumber";
        break;
      default:
        // Default to submittedDate if an unexpected or no sortField is provided.
        dbSortField = "application.createdAt";
        break;
    }
    const order =
      sortOrder?.toUpperCase() === FieldSortOrder.DESC
        ? FieldSortOrder.DESC
        : FieldSortOrder.ASC;
    query.orderBy(dbSortField, order);
  }
}
