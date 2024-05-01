import {
  PaginationOptions,
  EducationProgramsSummary,
  PaginatedResults,
} from "@/types";
import ApiClient from "@/services/http/ApiClient";
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
   * Creates a new education program.
   * @param payload information to create the new program.
   * @returns id of the created program.
   */
  async createEducationProgram(
    payload: EducationProgramAPIInDTO,
  ): Promise<void> {
    await ApiClient.EducationProgram.createEducationProgram(payload);
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
   * @returns key/value pair list of all approved programs.
   */
  async getProgramsListForInstitutions(): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.EducationProgram.getProgramsListForInstitutions();
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
}
