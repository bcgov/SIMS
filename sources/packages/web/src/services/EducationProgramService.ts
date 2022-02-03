import {
  SummaryEducationProgramDto,
  OptionItemDto,
  StudentEducationProgramDto,
  ProgramDto,
  EducationProgramData,
  DataTableSortOrder,
  InstitutionProgramSummaryFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  PaginatedResults,
} from "@/types";

import ApiClient from "./http/ApiClient";

export class EducationProgramService {
  // Share Instance
  private static instance: EducationProgramService;

  public static get shared(): EducationProgramService {
    return this.instance || (this.instance = new this());
  }

  public async getProgram(programId: number): Promise<ProgramDto> {
    return ApiClient.EducationProgram.getProgram(programId);
  }

  public async createProgram(data: ProgramDto): Promise<void> {
    await ApiClient.EducationProgram.createProgram(data);
  }

  public async updateProgram(
    programId: number,
    data: ProgramDto,
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
   * @param searchName,program name keyword to be searched
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns program summary for an institution location.
   */
  public async getLocationProgramsSummary(
    locationId: number,
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    searchProgramName?: string,
    sortField?: InstitutionProgramSummaryFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<SummaryEducationProgramDto>> {
    return ApiClient.EducationProgram.getLocationProgramsSummary(
      locationId,
      page,
      pageCount,
      searchProgramName,
      sortField,
      sortOrder,
    );
  }

  public async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramData> {
    return ApiClient.EducationProgram.getEducationProgram(programId);
  }

  public async getStudentEducationProgram(
    programId: number,
  ): Promise<StudentEducationProgramDto> {
    return ApiClient.EducationProgram.getStudentEducationProgram(programId);
  }

  /**
   * Gets location programs option list authorized for students.
   * @param locationId location id.
   * @returns location programs option list.
   */
  public async getLocationProgramsOptionList(
    locationId: number,
    programYearId: number,
    includeInActivePY?: boolean,
  ): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgram.getLocationProgramsOptionList(
      locationId,
      programYearId,
      includeInActivePY,
    );
  }

  /**
   * Gets location programs list authorized for institutions.
   * @returns location programs list for institutions.
   */
  public async getProgramsListForInstitutions(): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgram.getProgramsListForInstitutions();
  }

  /**
   * Education Program Details for ministry users
   * @param programId program id
   * @returns Education Program Details
   */
  public async getEducationProgramForAEST(
    programId: number,
  ): Promise<EducationProgramData> {
    return ApiClient.EducationProgram.getEducationProgramForAEST(programId);
  }
}
