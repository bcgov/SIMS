import { PaginationOptions } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import { getPaginationQueryString } from "@/helpers";
import {
  ApproveProgramAPIInDTO,
  DeactivateProgramAPIInDTO,
  DeclineProgramAPIInDTO,
  EducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
  EducationProgramsSummaryAPIOutDTO,
  OptionItemAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  StudentEducationProgramAPIOutDTO,
} from "@/services/http/dto";

export class EducationProgramApi extends HttpBaseClient {
  /**
   * Get programs for a particular location with pagination.
   * @param locationId id of the location.
   * @param paginationOptions pagination options.
   * @returns paginated programs summary.
   */
  async getProgramsSummaryByLocationId(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    const url = `education-program/location/${locationId}/summary?${getPaginationQueryString(
      paginationOptions,
      true,
    )}`;

    return this.getCall<
      PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }

  /**
   * Get the programs summary of an institution with pagination.
   * @param institutionId id of the institution.
   * @param paginationOptions pagination options.
   * @returns paginated programs summary.
   */
  async getProgramsSummaryByInstitutionId(
    institutionId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    const url = `education-program/institution/${institutionId}/summary?${getPaginationQueryString(
      paginationOptions,
    )}`;

    return this.getCall<
      PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }

  /**
   * Get the education program information.
   * @param programId program id.
   * @returns programs information.
   * */
  async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramAPIOutDTO> {
    return this.getCall<EducationProgramAPIOutDTO>(
      this.addClientRoot(`education-program/${programId}`),
    );
  }

  /**
   * Creates a new education program.
   * @param payload information to create the new program.
   */
  async createEducationProgram(
    payload: EducationProgramAPIInDTO,
  ): Promise<void> {
    await this.postCall(this.addClientRoot("education-program"), payload);
  }

  /**
   * Updates the main information for an existing education program.
   * @param programId program to be updated.
   * @param payload information to be updated.
   */
  async updateEducationProgram(
    programId: number,
    payload: EducationProgramAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`education-program/${programId}`),
      payload,
    );
  }

  /**
   * Returns the education program for a student.
   * @param programId program id to be returned.
   * @returns education program for a student.
   */
  async getStudentEducationProgram(
    programId: number,
  ): Promise<StudentEducationProgramAPIOutDTO> {
    return this.getCall(this.addClientRoot(`education-program/${programId}`));
  }

  /**
   * Gets location programs option list authorized for students.
   * @param locationId location id.
   * @param programYearId program year id.
   * @param loadInActiveProgram do we need to load inactive program to the list or not.
   * @param isIncludeInActiveProgramYear isIncludeInActiveProgramYear, if isIncludeInActiveProgramYear, then both active
   * and not active program year is considered.
   * @returns location programs option list.
   */
  async getLocationProgramsOptionList(
    locationId: number,
    programYearId: number,
    loadInActiveProgram: boolean,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<OptionItemAPIOutDTO[]> {
    let url = `education-program/location/${locationId}/program-year/${programYearId}/loadInActiveProgram/${loadInActiveProgram}/options-list`;
    if (isIncludeInActiveProgramYear) {
      url = `${url}?isIncludeInActiveProgramYear=${isIncludeInActiveProgramYear}`;
    }
    return this.getCall<OptionItemAPIOutDTO[]>(this.addClientRoot(url));
  }

  /**
   * Get a key/value pair list of all approved programs.
   * @returns key/value pair list of all approved programs.
   */
  async getProgramsListForInstitutions(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCall<OptionItemAPIOutDTO[]>(
      this.addClientRoot("education-program/programs-list"),
    );
  }

  /**
   * Ministry user approves a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @param payload information to approve the program.
   */
  async approveProgram(
    programId: number,
    institutionId: number,
    payload: ApproveProgramAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(
        `education-program/${programId}/institution/${institutionId}/approve`,
      ),
      payload,
    );
  }

  /**
   * Ministry user declines a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @payload note to decline the program.
   */
  async declineProgram(
    programId: number,
    institutionId: number,
    payload: DeclineProgramAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(
        `education-program/${programId}/institution/${institutionId}/decline`,
      ),
      payload,
    );
  }

  /**
   * Allows a program to be deactivated.
   * @param programId program to be deactivated.
   * @param payload information to support the deactivation.
   */
  async deactivateProgram(
    programId: number,
    payload?: DeactivateProgramAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`education-program/${programId}/deactivate`),
      payload,
    );
  }
}
