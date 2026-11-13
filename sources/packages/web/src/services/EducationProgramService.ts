import {
  PaginationOptions,
  EducationProgramsSummary,
  PaginatedResults,
} from "@/types";
import ApiClient from "@/services/http/ApiClient";
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
import { useFormatters } from "@/composables";

export class EducationProgramService {
  // Share Instance
  private static instance: EducationProgramService;

  public static get shared(): EducationProgramService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get programs for a particular location with pagination.
   * @param locationId id of the location.
   * @param paginationOptions pagination options.
   * @returns paginated programs summary.
   */
  async getProgramsSummaryByLocationId(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<EducationProgramsSummary>> {
    const programs =
      await ApiClient.EducationProgram.getProgramsSummaryByLocationId(
        locationId,
        paginationOptions,
      );
    return this.formatProgramsSummary(programs);
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
  ): Promise<PaginatedResults<EducationProgramsSummary>> {
    const programs =
      await ApiClient.EducationProgram.getProgramsSummaryByInstitutionId(
        institutionId,
        paginationOptions,
      );
    return this.formatProgramsSummary(programs);
  }

  /**
   * Apply formats to adapt data to be displayed in the UI as needed.
   * @param programs programs have data formatted as needed.
   * @returns formatted programs.
   */
  private formatProgramsSummary(
    programs: PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>,
  ): PaginatedResults<EducationProgramsSummary> {
    const { dateOnlyLongString } = useFormatters();
    return {
      results: programs.results.map((program) => ({
        ...program,
        submittedDateFormatted: dateOnlyLongString(program.submittedDate),
      })),
      count: programs.count,
    };
  }

  /**
   * Get the program configuration for creation, including context, visual schema,
   * and validation schema, using the active configuration for the provided program year.
   * Paired with the creation endpoint ({@link createEducationProgram}).
   * @param programYearId ID of the program year.
   * @returns the program configuration including context, visual schema, and validation schema.
   */
  async getEducationProgramConfigurationForCreate(
    programYearId: number,
  ): Promise<EducationProgramConfigurationAPIOutDTO> {
    return ApiClient.EducationProgram.getEducationProgramConfigurationForCreate(
      programYearId,
    );
  }

  /**
   * Get the list of program years with at least one education program configuration.
   * @returns program years and whether they have an active program configuration.
   */
  async getProgramYearsList(): Promise<EducationProgramYearAPIOutDTO[]> {
    return ApiClient.EducationProgram.getProgramYearsList();
  }

  /**
   * Get the education program information.
   * @param programId program id.
   * @returns programs information.
   * */
  async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramAPIOutDTO> {
    return ApiClient.EducationProgram.getEducationProgram(programId);
  }

  /**
   * Get the program configuration for renewal.
   * It includes a new program context and the data from the previous program.
   * Paired with the renewal endpoint ({@link renewEducationProgram}).
   * @param programId the ID of the education program to be renewed.
   * @returns the next program configuration for renewal.
   */
  async getEducationProgramConfigurationForRenew(
    programId: number,
  ): Promise<EducationProgramConfigurationAPIOutDTO> {
    return ApiClient.EducationProgram.getEducationProgramConfigurationForRenew(
      programId,
    );
  }

  /**
   * Creates a new education program for the provided program year.
   * Paired with the endpoint that provides the creation configuration
   * ({@link getEducationProgramConfigurationForCreate}).
   * @param programYearId ID of the program year the program is being created for.
   * @param payload information to create the new program.
   * @returns id of the created program.
   */
  async createEducationProgram(
    programYearId: number,
    payload: CreateEducationProgramAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return ApiClient.EducationProgram.createEducationProgram(
      programYearId,
      payload,
    );
  }

  /**
   * Renews an existing education program, creating a new program
   * for the next program configuration.
   * Paired with the endpoint that provides the renewal configuration
   * ({@link getEducationProgramConfigurationForRenew}).
   * @param programId ID of the education program to be renewed.
   * @param payload information to create the renewed program.
   * @returns id of the created program.
   */
  async renewEducationProgram(
    programId: number,
    payload: CreateEducationProgramAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return ApiClient.EducationProgram.renewEducationProgram(programId, payload);
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
    await ApiClient.EducationProgram.updateEducationProgram(programId, payload);
  }

  /**
   * Returns the education program for a student.
   * @param programId program id to be returned.
   * @returns education program for a student.
   */
  async getStudentEducationProgram(
    programId: number,
  ): Promise<StudentEducationProgramAPIOutDTO> {
    return ApiClient.EducationProgram.getStudentEducationProgram(programId);
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
    return ApiClient.EducationProgram.getLocationProgramsOptionList(
      locationId,
      programYearId,
      isIncludeInActiveProgramYear,
    );
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
    return ApiClient.EducationProgram.getProgramsListForInstitutions(options);
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
    return ApiClient.EducationProgram.getProgramsForProgramYear(
      programYearId,
      paginationOptions,
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
    await ApiClient.EducationProgram.approveProgram(
      programId,
      institutionId,
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
    await ApiClient.EducationProgram.declineProgram(
      programId,
      institutionId,
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
    await ApiClient.EducationProgram.deactivateProgram(programId, payload);
  }

  /**
   * Gets a list of Programs with status 'Pending' where the Program is active/not expired.
   * Pagination, sort and search are available on results.
   * @param paginationOptions Pagination options.
   * @returns pending programs.
   */
  async getPendingPrograms(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramPendingAPIOutDTO>> {
    return ApiClient.EducationProgram.getPendingPrograms(paginationOptions);
  }

  /**
   * Evaluate program's calculated data based on the provided data and key.
   * @param payload contains the data and key for evaluation.
   * @returns the calculated data based on the evaluation.
   */
  async evaluate(
    payload: ProgramEvaluationAPIInDTO,
  ): Promise<ProgramEvaluationAPIOutDTO> {
    return ApiClient.EducationProgram.evaluate(payload);
  }
}
