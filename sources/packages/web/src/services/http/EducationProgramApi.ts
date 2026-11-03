import { PaginationOptions } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import { getPaginationQueryString } from "@/helpers";
import {
  ApproveProgramAPIInDTO,
  CreateEducationProgramAPIInDTO,
  DeactivateProgramAPIInDTO,
  DeclineProgramAPIInDTO,
  EducationProgramAPIOutDTO,
  EducationProgramConfigurationAPIOutDTO,
  EducationProgramManagerDetailsAPIOutDTO,
  EducationProgramPendingAPIOutDTO,
  EducationProgramsSummaryAPIOutDTO,
  EducationProgramYearAPIOutDTO,
  OptionItemAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  PrimaryIdentifierAPIOutDTO,
  ProgramEvaluationAPIInDTO,
  ProgramEvaluationAPIOutDTO,
  StudentEducationProgramAPIOutDTO,
  UpdateEducationProgramAPIInDTO,
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
   * Get the active program configuration including context, visual schema, and validation schema,
   * for the provided program year.
   * @param programYearId ID of the program year.
   * @returns the program configuration including context, visual schema, and validation schema.
   */
  async getEducationProgramConfiguration(
    programYearId: number,
  ): Promise<EducationProgramConfigurationAPIOutDTO> {
    return this.getCall(
      this.addClientRoot(
        `education-program/program-year/${programYearId}/configuration`,
      ),
    );
  }

  /**
   * Get the list of program years with at least one education program configuration.
   * @returns program years and whether they have an active program configuration.
   */
  async getProgramYearsList(): Promise<EducationProgramYearAPIOutDTO[]> {
    return this.getCall<EducationProgramYearAPIOutDTO[]>(
      this.addClientRoot("education-program/program-years-list"),
    );
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
   * Get the program configuration for renewal.
   * It includes a new program context and the data from the previous program.
   * @param programId the ID of the education program to be renewed.
   * @returns the next program configuration for renewal.
   */
  async getEducationProgramForRenew(
    programId: number,
  ): Promise<EducationProgramConfigurationAPIOutDTO> {
    return this.getCall<EducationProgramConfigurationAPIOutDTO>(
      this.addClientRoot(`education-program/${programId}/renew`),
    );
  }

  /**
   * Creates a new education program.
   * @param payload information to create the new program.
   * @returns id of the created program.
   */
  async createEducationProgram(
    payload: CreateEducationProgramAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.postCall(this.addClientRoot("education-program"), payload);
  }

  /**
   * Renews an existing education program, creating a new program
   * for the next program configuration.
   * @param programId ID of the education program to be renewed.
   * @param payload information to create the renewed program.
   * @returns id of the created program.
   */
  async renewEducationProgram(
    programId: number,
    payload: CreateEducationProgramAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.postCall(
      this.addClientRoot(`education-program/program/${programId}/renew`),
      payload,
    );
  }

  /**
   * Updates an existing education program.
   * @param programId program to be updated.
   * @param payload information to be updated.
   */
  async updateEducationProgram(
    programId: number,
    payload: UpdateEducationProgramAPIInDTO,
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
   * @param isIncludeInActiveProgramYear isIncludeInActiveProgramYear, if isIncludeInActiveProgramYear, then both active
   * and not active program year is considered.
   * @returns location programs option list.
   */
  async getLocationProgramsOptionList(
    locationId: number,
    programYearId: number,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<OptionItemAPIOutDTO[]> {
    let url = `education-program/location/${locationId}/program-year/${programYearId}/options-list`;
    if (isIncludeInActiveProgramYear) {
      url = `${url}?isIncludeInActiveProgramYear=${isIncludeInActiveProgramYear}`;
    }
    return this.getCall<OptionItemAPIOutDTO[]>(this.addClientRoot(url));
  }

  /**
   * Get a key/value pair list of all approved programs.
   * @param options method options:
   * - `institutionId`: if provided, programs list for that institution is returned.
   * Used to get programs for a particular institution from the ministry side.
   * - `isIncludeInActiveProgram`: if isIncludeInActiveProgram, then both active
   * and not active education program is considered.
   * @returns key/value pair list of all approved programs.
   */
  async getProgramsListForInstitutions(options?: {
    institutionId?: number;
    isIncludeInActiveProgram?: boolean;
  }): Promise<OptionItemAPIOutDTO[]> {
    let url = options?.institutionId
      ? `education-program/institution/${options.institutionId}/programs-list`
      : "education-program/programs-list";
    if (options?.isIncludeInActiveProgram) {
      url = `${url}?isIncludeInActiveProgram=${options?.isIncludeInActiveProgram}`;
    }
    return this.getCall<OptionItemAPIOutDTO[]>(this.addClientRoot(url));
  }

  /**
   * Get the list of education programs for a specific program year.
   * @param programYearId ID of the program year.
   * @param paginationOptions Pagination options for the results.
   * @returns Paginated list of education programs for the specified program year.
   */
  async getProgramsForProgramYear(
    programYearId: number,
    paginationOptions: PaginationOptions,
  ): Promise<
    PaginatedResultsAPIOutDTO<EducationProgramManagerDetailsAPIOutDTO>
  > {
    const url = `education-program/programs/program-year/${programYearId}?${getPaginationQueryString(
      paginationOptions,
    )}`;
    return this.getCall(this.addClientRoot(url));
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

  /**
   * Gets a list of Programs with status 'Pending' where the Program is active/not expired.
   * @param paginationOptions The pagination options.
   * @returns pending programs.
   */
  async getPendingPrograms(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramPendingAPIOutDTO>> {
    const url = `education-program/pending?${getPaginationQueryString(
      paginationOptions,
    )}`;
    return this.getCall<
      PaginatedResultsAPIOutDTO<EducationProgramPendingAPIOutDTO>
    >(this.addClientRoot(url));
  }

  /**
   * Evaluate program's calculated data based on the provided data and key.
   * @param payload contains the data and key for evaluation.
   * @returns the calculated data based on the evaluation.
   */
  async evaluate(
    payload: ProgramEvaluationAPIInDTO,
  ): Promise<ProgramEvaluationAPIOutDTO> {
    return this.postCall(
      this.addClientRoot("education-program/evaluate"),
      payload,
    );
  }
}
