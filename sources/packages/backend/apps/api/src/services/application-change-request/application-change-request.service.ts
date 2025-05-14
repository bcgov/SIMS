import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Application, ApplicationEditStatus } from "@sims/sims-db";
import { DataSource, Repository, Brackets, SelectQueryBuilder } from "typeorm";
import { StudentChangeRequestPendingPaginationOptionsAPIInDTO } from "../../route-controllers/models/pagination.dto";
import { PaginatedResults } from "../../utilities";
import { FieldSortOrder } from "@sims/utilities";

/**
 * Service responsible for application change request operations.
 */
@Injectable()
export class ApplicationChangeRequestService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  /**
   * Gets applications based purely on their edit status.
   * @param targetStatus The application_edit_status to filter by.
   * @param paginationOptions Pagination, sorting, and search options from the controller.
   * @returns Paginated list of applications.
   */
  async getApplicationsForChangeRequestList(
    targetStatus: ApplicationEditStatus,
    paginationOptions: StudentChangeRequestPendingPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResults<Application>> {
    const { page, pageLimit, sortField, sortOrder, searchCriteria } =
      paginationOptions;

    const query = this.applicationRepo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "application.applicationNumber",
        "application.createdAt",
        "application.applicationEditStatus",
      ])
      .innerJoin("application.student", "student")
      .addSelect(["student.id"])
      .innerJoin("student.user", "user")
      .addSelect(["user.firstName", "user.lastName"])
      .innerJoinAndSelect("application.parentApplication", "parentApp")
      .where("application.applicationEditStatus = :targetStatus", {
        targetStatus,
      });

    if (searchCriteria) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where("user.firstName ILIKE :searchCriteria", {
            searchCriteria: `%${searchCriteria}%`,
          })
            .orWhere("user.lastName ILIKE :searchCriteria", {
              searchCriteria: `%${searchCriteria}%`,
            })
            .orWhere("application.applicationNumber ILIKE :searchCriteria", {
              searchCriteria: `%${searchCriteria}%`,
            });
        }),
      );
    }

    this.addApplicationChangeRequestSort(
      query,
      sortField,
      sortOrder as FieldSortOrder,
    );

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
