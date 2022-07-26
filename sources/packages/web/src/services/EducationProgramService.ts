import {
  OptionItemDto,
  PaginationOptions,
  EducationProgramsSummary,
  PaginatedResults,
} from "@/types";
import ApiClient from "@/services/http/ApiClient";
import {
  ApproveProgramAPIInDTO,
  DeclineProgramAPIInDTO,
  EducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
  EducationProgramsSummaryAPIOutDTO,
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
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummary>> {
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

  async createEducationProgram(
    payload: EducationProgramAPIInDTO,
  ): Promise<void> {
    await ApiClient.EducationProgram.createEducationProgram(payload);
  }

  async updateProgram(
    programId: number,
    payload: EducationProgramAPIInDTO,
  ): Promise<void> {
    await ApiClient.EducationProgram.updateProgram(programId, payload);
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
   * @returns location programs option list.
   */
  async getLocationProgramsOptionList(
    locationId: number,
    programYearId: number,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgram.getLocationProgramsOptionList(
      locationId,
      programYearId,
      isIncludeInActiveProgramYear,
    );
  }

  /**
   * Gets location programs list authorized for institutions.
   * @returns location programs list for institutions.
   */
  async getProgramsListForInstitutions(): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgram.getProgramsListForInstitutions();
  }

  /**
   * Ministry user approve's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @param payload ApproveProgram.
   */
  async approveProgram(
    programId: number,
    institutionId: number,
    payload: ApproveProgramAPIInDTO,
  ): Promise<void> {
    return ApiClient.EducationProgram.approveProgram(
      programId,
      institutionId,
      payload,
    );
  }

  /**
   * Ministry user decline's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @param payload DeclineProgram.
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
}
