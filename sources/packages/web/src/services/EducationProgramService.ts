import {
  OptionItemDto,
  ApproveProgram,
  DeclineProgram,
  StudentEducationProgramAPIOutDTO,
  EducationProgramAPIDTO,
  PaginationOptions,
} from "@/types";
import ApiClient from "@/services/http/ApiClient";
import {
  AESTEducationProgramAPIOutDTO,
  EducationProgramAPIOutDTO,
  EducationProgramsSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";

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
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    return ApiClient.EducationProgram.getProgramsSummaryByLocationId(
      locationId,
      paginationOptions,
    );
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
    return ApiClient.EducationProgram.getProgramsSummaryByInstitutionId(
      institutionId,
      paginationOptions,
    );
  }

  /**
   * Get complete program information for a program id.
   * @param programId program id
   * @returns program information.
   */
  async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramAPIOutDTO | AESTEducationProgramAPIOutDTO> {
    return ApiClient.EducationProgram.getEducationProgram(programId);
  }

  async createEducationProgram(data: EducationProgramAPIDTO): Promise<void> {
    await ApiClient.EducationProgram.createEducationProgram(data);
  }

  async updateProgram(
    programId: number,
    data: EducationProgramAPIDTO,
  ): Promise<void> {
    await ApiClient.EducationProgram.updateProgram(programId, data);
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
    payload: ApproveProgram,
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
    payload: DeclineProgram,
  ): Promise<void> {
    await ApiClient.EducationProgram.declineProgram(
      programId,
      institutionId,
      payload,
    );
  }
}
