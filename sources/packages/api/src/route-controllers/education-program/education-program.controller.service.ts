import { Injectable } from "@nestjs/common";
import { EducationProgramService } from "../../services";
import { OfferingTypes } from "../../database/entities";
import {
  PaginatedResultsAPIOutDTO,
  ProgramsPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { EducationProgramsSummaryAPIOutDTO } from "./models/education-program.dto";
import { credentialTypeToDisplay } from "src/utilities";

@Injectable()
export class EducationProgramControllerService {
  constructor(private readonly programService: EducationProgramService) {}

  /**
   * Gets all the programs that are associated with an institution
   * alongside with the total of offerings on a particular location.
   * @param institutionId id of the institution.
   * @param paginationOptions pagination options
   * @param locationId optional location id to filter while
   * calculating the total of offering.
   * @returns paginated summary for the institution or location.
   */
  async getProgramsSummary(
    institutionId: number,
    paginationOptions: ProgramsPaginationOptionsAPIInDTO,
    locationId?: number,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    const programs = await this.programService.getProgramsSummary(
      institutionId,
      [OfferingTypes.Public, OfferingTypes.Private],
      paginationOptions,
      locationId,
    );

    return {
      results: programs.results.map((program) => ({
        programId: program.programId,
        programName: program.programName,
        cipCode: program.cipCode,
        credentialType: program.credentialType,
        totalOfferings: program.totalOfferings,
        submittedDate: program.submittedDate,
        locationId: program.locationId,
        locationName: program.locationName,
        programStatus: program.programStatus,
        credentialTypeToDisplay: credentialTypeToDisplay(
          program.credentialType,
        ),
      })),
      count: programs.count,
    };
  }
}
