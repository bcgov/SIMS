import {
  SummaryEducationProgramDto,
  OptionItemDto,
  DataTableSortOrder,
  ProgramSummaryFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  PaginatedResults,
  ApproveProgram,
  DeclineProgram,
  StudentEducationProgramAPIOutDTO,
  EducationProgramAPIDTO,
  PaginationOptions,
} from "@/types";
import ApiClient from "@/services/http/ApiClient";
import {
  EducationProgramAPIOutDTO,
  EducationProgramDetailsAPIOutDTO,
  EducationProgramsSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";

export class EducationProgramService {
  // Share Instance
  private static instance: EducationProgramService;

  public static get shared(): EducationProgramService {
    return this.instance || (this.instance = new this());
  }

  async getProgramsSummaryByLocationId(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    return ApiClient.EducationProgram.getProgramsSummaryByLocationId(
      locationId,
      paginationOptions,
    );
  }

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
  async getProgram(programId: number): Promise<EducationProgramAPIOutDTO> {
    return ApiClient.EducationProgram.getProgram(programId);
  }

  async createProgram(data: EducationProgramAPIDTO): Promise<void> {
    await ApiClient.EducationProgram.createProgram(data);
  }

  async updateProgram(
    programId: number,
    data: EducationProgramAPIDTO,
  ): Promise<void> {
    await ApiClient.EducationProgram.updateProgram(programId, data);
  }

  /**
   * Method to call the API to fetch all institution
   * location program.
   * @param locationId location id
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageLimit, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param searchCriteria,program name keyword to be searched
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns program summary for an institution location.
   */
  public async getLocationProgramsSummary(
    locationId: number,
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    searchCriteria?: string,
    sortField?: ProgramSummaryFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<SummaryEducationProgramDto>> {
    return ApiClient.EducationProgram.getLocationProgramsSummary(
      locationId,
      page,
      pageCount,
      searchCriteria,
      sortField,
      sortOrder,
    );
  }

  /**
   * Get program details for a program id.
   * @param programId program id
   * @returns program information.
   */
  async getEducationProgramDetails(
    programId: number,
  ): Promise<EducationProgramDetailsAPIOutDTO> {
    return ApiClient.EducationProgram.getEducationProgramDetails(programId);
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
