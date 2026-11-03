import { Injectable } from "@nestjs/common";
import { EducationProgram, EducationProgramConfiguration } from "@sims/sims-db";
import { MoreThan, Repository } from "typeorm";
import {
  PaginatedResults,
  ProgramsManagementPaginationOptions,
} from "../../utilities";
import { InjectRepository } from "@nestjs/typeorm";
import { FieldSortOrder } from "@sims/utilities";

/**
 * Maps the sort fields received from the API to the
 * {@link EducationProgram} entity properties.
 */
const PROGRAMS_MANAGEMENT_SORT_FIELDS: Record<string, keyof EducationProgram> =
  {
    programName: "name",
    credentialType: "credentialType",
    cipCode: "cipCode",
    sabcCode: "sabcCode",
    programStatus: "programStatus",
  };

@Injectable()
export class EducationProgramManagerService {
  constructor(
    @InjectRepository(EducationProgram)
    private readonly educationProgramRepo: Repository<EducationProgram>,
    @InjectRepository(EducationProgramConfiguration)
    private readonly educationProgramConfigurationRepo: Repository<EducationProgramConfiguration>,
  ) {}

  async getActiveConfiguration(
    educationProgramConfigurationId: number,
  ): Promise<EducationProgramConfiguration> {
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
        id: educationProgramConfigurationId,
        isActive: true,
      },
    });
  }

  async getProgramConfigurations(): Promise<EducationProgramConfiguration[]> {
    return this.educationProgramConfigurationRepo.find({
      select: {
        id: true,
        isActive: true,
        programYear: {
          id: true,
          programYear: true,
        },
      },
      relations: {
        programYear: true,
      },
      where: {
        isActive: true,
      },
      order: {
        programYear: {
          startDate: "DESC",
        },
      },
    });
  }

  async getNextProgramConfigurationForRenewal(
    currentStartDateReference: string,
  ): Promise<EducationProgramConfiguration | null> {
    const nextConfiguration =
      await this.educationProgramConfigurationRepo.findOne({
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
          programYear: {
            startDate: MoreThan(currentStartDateReference),
          },
        },
        order: {
          programYear: {
            startDate: "ASC",
          },
        },
      });
    return nextConfiguration?.isActive ? nextConfiguration : null;
  }

  async getEducationProgramsManagerDetails(
    institutionId: number,
    educationProgramConfigurationId: number,
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
          id: educationProgramConfigurationId,
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
