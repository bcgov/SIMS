import { Injectable } from "@nestjs/common";
import {
  combineWhereConditions,
  EducationProgram,
  EducationProgramConfiguration,
  ProgramYear,
} from "@sims/sims-db";
import {
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Like,
  Not,
  Or,
  Raw,
  Repository,
} from "typeorm";
import {
  PaginatedResults,
  ProgramsManagementPaginationOptions,
} from "../../utilities";
import { InjectRepository } from "@nestjs/typeorm";
import { FieldSortOrder } from "@sims/utilities";
import {
  PROGRAMS_MANAGEMENT_SORT_FIELDS,
  ProgramYearWithConfiguration,
} from "./education-program.manager.models";

@Injectable()
export class EducationProgramManagerService {
  constructor(
    @InjectRepository(EducationProgram)
    private readonly educationProgramRepo: Repository<EducationProgram>,
    @InjectRepository(EducationProgramConfiguration)
    private readonly educationProgramConfigurationRepo: Repository<EducationProgramConfiguration>,
    @InjectRepository(ProgramYear)
    private readonly programYearRepo: Repository<ProgramYear>,
  ) {}

  /**
   * Gets the program years that have at least one education program
   * configuration associated with them, independently of whether the
   * configuration is active or not.
   * An active configuration is required for renewal purposes only. If a
   * program year had a configuration, there is a potential to education
   * programs being offered in that year.
   * @returns program years with at least one program configuration, including
   * whether at least one of the configurations is active.
   */
  getProgramYears(): Promise<ProgramYearWithConfiguration[]> {
    return this.programYearRepo
      .createQueryBuilder("programYear")
      .select("programYear.id", "id")
      .addSelect("programYear.programYear", "programYear")
      .addSelect("BOOL_OR(configuration.isActive)", "hasActiveConfiguration")
      .innerJoin(
        EducationProgramConfiguration,
        "configuration",
        "configuration.programYear.id = programYear.id",
      )
      .groupBy("programYear.id")
      .orderBy("programYear.startDate", "DESC")
      .getRawMany<ProgramYearWithConfiguration>();
  }

  /**
   * Get the next active education program configuration for renewal based
   * on the current program year.
   * The next program year is the one immediately after the current program
   * year, and its active configuration is the one expected to be used for
   * renewals.
   * @param currentProgramYearId the ID of the current program year to find
   * the next education program configuration.
   * @returns the active education program configuration of the next program
   * year, or null if there is no next program year or it has no active
   * configuration.
   */
  getNextProgramConfigurationForRenewal(
    currentProgramYearId: number,
  ): Promise<EducationProgramConfiguration | null> {
    if (!currentProgramYearId) {
      throw new Error(
        "Current program year ID is required to find the next program configuration.",
      );
    }
    // Subquery to find the program year immediately after the current program year.
    const nextProgramYearQuery = this.programYearRepo
      .createQueryBuilder("nextProgramYear")
      .select("nextProgramYear.id")
      .innerJoin(
        ProgramYear,
        "currentProgramYear",
        "currentProgramYear.id = :currentProgramYearId",
      )
      .where("nextProgramYear.startDate > currentProgramYear.startDate")
      .orderBy("nextProgramYear.startDate", "ASC")
      .limit(1);
    return this.educationProgramConfigurationRepo.findOne({
      select: {
        id: true,
        isActive: true,
        programYear: {
          id: true,
          startDate: true,
        },
      },
      relations: {
        programYear: true,
      },
      where: {
        isActive: true,
        programYear: {
          id: Raw(
            (alias) => `${alias} = (${nextProgramYearQuery.getQuery()})`,
            { currentProgramYearId },
          ),
        },
      },
    });
  }

  /**
   * Gets the education programs of an institution for a program year.
   * @param institutionId institution the programs belong to.
   * @param programYearId program year the programs are associated with.
   * @param paginationOptions pagination, sort, and status filter options.
   * @returns paginated education programs.
   */
  async getEducationProgramsManagerDetails(
    institutionId: number,
    programYearId: number,
    paginationOptions: ProgramsManagementPaginationOptions,
  ): Promise<PaginatedResults<EducationProgram>> {
    const sortField =
      PROGRAMS_MANAGEMENT_SORT_FIELDS[paginationOptions.sortField] ?? "name";
    const baseWhere: FindOptionsWhere<EducationProgram> = {
      institution: {
        id: institutionId,
      },
      programConfiguration: {
        programYear: {
          id: programYearId,
        },
      },
    };
    const [results, count] = await this.educationProgramRepo.findAndCount({
      select: {
        id: true,
        name: true,
        credentialType: true,
        cipCode: true,
        sabcCode: true,
        programStatus: true,
        isActive: true,
        effectiveEndDate: true,
        renewedProgram: {
          id: true,
        },
      },
      relations: {
        renewedProgram: true,
      },
      where: combineWhereConditions(
        baseWhere,
        this.getProgramStatusWhereConditions(paginationOptions),
        this.getRenewalWhereConditions(paginationOptions),
        this.getSearchWhereConditions(paginationOptions),
      ),
      skip: paginationOptions.pageLimit * paginationOptions.page,
      take: paginationOptions.pageLimit,
      order: {
        [sortField]: paginationOptions.sortOrder ?? FieldSortOrder.ASC,
      },
    });
    return { results, count };
  }

  /**
   * Builds the where conditions to filter the programs by renewal.
   * A renewed program is a program already renewed into the next program year
   * (another program has it as its preceding program), while a not renewed
   * program is everything else.
   * - No filter or both filters: all programs are returned.
   * - Renewed filter only: programs with a renewed program.
   * - Not renewed filter only: programs without a renewed program.
   * @param paginationOptions options containing the renewal filters.
   * @returns where conditions, where each array item is combined using OR.
   */
  private getRenewalWhereConditions(
    paginationOptions: ProgramsManagementPaginationOptions,
  ): FindOptionsWhere<EducationProgram>[] {
    const renewedProgramSearch = !!paginationOptions.renewedProgramSearch;
    const notRenewedProgramSearch = !!paginationOptions.notRenewedProgramSearch;
    if (renewedProgramSearch === notRenewedProgramSearch) {
      return [{}];
    }
    // The renewed program is the inverse side of the relationship, hence the
    // condition is applied to its ID, which is left joined.
    return [
      {
        renewedProgram: {
          id: renewedProgramSearch ? Not(IsNull()) : IsNull(),
        },
      },
    ];
  }

  /**
   * Builds the where conditions to filter the programs by status.
   * - No filter: all programs are returned.
   * - Status filter only: active and non-expired programs with one of the statuses.
   * - Inactive filter only: inactive or expired programs.
   * - Both filters: programs matching any of the above conditions.
   * @param paginationOptions options containing the status filters.
   * @returns where conditions, where each array item is combined using OR.
   */
  private getProgramStatusWhereConditions(
    paginationOptions: ProgramsManagementPaginationOptions,
  ): FindOptionsWhere<EducationProgram>[] {
    const { statusSearch, inactiveProgramSearch } = paginationOptions;
    if (!statusSearch?.length && !inactiveProgramSearch) {
      return [{}];
    }
    const conditions: FindOptionsWhere<EducationProgram>[] = [];
    if (statusSearch?.length) {
      conditions.push({
        programStatus: In(statusSearch),
        isActive: true,
        effectiveEndDate: Or(
          IsNull(),
          Raw((alias) => `${alias} > CURRENT_DATE`),
        ),
      });
    }
    if (inactiveProgramSearch) {
      conditions.push(
        { isActive: false },
        { effectiveEndDate: Raw((alias) => `${alias} <= CURRENT_DATE`) },
      );
    }
    return conditions;
  }

  /**
   * Builds the where conditions to filter the programs by the search criteria,
   * matching the program name, CIP code, or SABC code.
   * @param paginationOptions options containing the search criteria.
   * @returns where conditions, where each array item is combined using OR.
   */
  private getSearchWhereConditions(
    paginationOptions: ProgramsManagementPaginationOptions,
  ): FindOptionsWhere<EducationProgram>[] {
    const searchCriteria = paginationOptions.searchCriteria?.trim();
    if (!searchCriteria) {
      return [{}];
    }
    return [
      { name: ILike(`%${searchCriteria}%`) },
      { cipCode: Like(`%${searchCriteria}%`) },
      { sabcCode: Like(`%${searchCriteria.toUpperCase()}%`) },
    ];
  }
}
