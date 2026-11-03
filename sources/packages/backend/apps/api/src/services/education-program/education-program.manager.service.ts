import { Injectable } from "@nestjs/common";
import {
  EducationProgram,
  EducationProgramConfiguration,
  ProgramYear,
} from "@sims/sims-db";
import { MoreThan, Repository } from "typeorm";
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
  async getProgramYears(): Promise<ProgramYearWithConfiguration[]> {
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
   * on the current program year's start date.
   * @param startDateReference the start date of the current program
   * year to find the next education program configuration.
   * @returns the next active education program configuration after the current
   * program year's start date, or null if none exists.
   */
  async getNextProgramConfigurationForRenewal(
    startDateReference: string,
  ): Promise<EducationProgramConfiguration | null> {
    if (!startDateReference) {
      throw new Error(
        "Current program year start date reference is required to find the next program configuration.",
      );
    }
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
          startDate: MoreThan(startDateReference),
        },
      },
      order: {
        programYear: {
          startDate: "ASC",
        },
      },
    });
  }

  async getEducationProgramsManagerDetails(
    institutionId: number,
    programYearId: number,
    paginationOptions: ProgramsManagementPaginationOptions,
  ): Promise<PaginatedResults<EducationProgram>> {
    const sortField =
      PROGRAMS_MANAGEMENT_SORT_FIELDS[paginationOptions.sortField] ?? "name";
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
      where: {
        institution: {
          id: institutionId,
        },
        programConfiguration: {
          programYear: {
            id: programYearId,
          },
        },
      },
      skip: paginationOptions.pageLimit * paginationOptions.page,
      take: paginationOptions.pageLimit,
      order: {
        [sortField]: paginationOptions.sortOrder ?? FieldSortOrder.ASC,
      },
    });
    return { results, count };
  }
}
