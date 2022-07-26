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
  PaginationOptions,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import { addSortOptions, getPaginationQueryString } from "@/helpers";
import {
  EducationProgramAPIOutDTO,
  EducationProgramDetailsAPIOutDTO,
  EducationProgramsSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";

export class EducationProgramApi extends HttpBaseClient {
  async getProgramsSummaryByLocationId(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    console.log(paginationOptions);
    const url =
      `education-program/location/${locationId}/summary?` +
      getPaginationQueryString(paginationOptions);
    return this.getCallTyped<
      PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }

  async getProgramsSummaryByInstitutionId(
    institutionId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    console.log(paginationOptions);
    const url =
      `education-program/institution/${institutionId}/summary?` +
      getPaginationQueryString(paginationOptions);
    return this.getCallTyped<
      PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }

  /**
   * Get complete program information for a program id.
   * @param programId program id
   * @returns program information.
   */
  async getProgram(programId: number): Promise<EducationProgramAPIOutDTO> {
    return this.getCallTyped<EducationProgramAPIOutDTO>(
      this.addClientRoot(`education-program/${programId}`),
    );
  }

  async createProgram(createProgramDto: any): Promise<void> {
    try {
      await this.apiClient.post(
        "education-program",
        createProgramDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  async updateProgram(programId: number, updateProgramDto: any): Promise<void> {
    try {
      await this.apiClient.put(
        `institution/education-program/${programId}`,
        updateProgramDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Prepare the API to fetch all institution
   * location program.
   * @param locationId location id
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageLimit, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param searchCriteria, program name keyword to be searched
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns program summary for an institution location.
   */
  async getLocationProgramsSummary(
    locationId: number,
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    searchCriteria?: string,
    sortField?: ProgramSummaryFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<SummaryEducationProgramDto>> {
    try {
      let url = `institution/education-program/location/${locationId}/summary?page=${page}&pageLimit=${pageCount}`;
      if (searchCriteria) {
        url = `${url}&searchCriteria=${searchCriteria}`;
      }
      url = addSortOptions(url, sortField, sortOrder);
      const response = await this.getCall(url);
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Get program details for a program id.
   * @param programId program id
   * @returns program information.
   */
  async getEducationProgramDetails(
    programId: number,
  ): Promise<EducationProgramDetailsAPIOutDTO> {
    return this.getCallTyped<EducationProgramDetailsAPIOutDTO>(
      this.addClientRoot(`education-program/${programId}/details`),
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
    return this.getCallTyped(
      this.addClientRoot(`education-program/${programId}`),
    );
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
    try {
      let url = `institution/education-program/location/${locationId}/program-year/${programYearId}/options-list`;
      if (isIncludeInActiveProgramYear) {
        url = `${url}?isIncludeInActiveProgramYear=${isIncludeInActiveProgramYear}`;
      }
      const response = await this.getCall(url);
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Gets location programs list authorized for institutions.
   * @returns location programs list for institutions.
   */
  async getProgramsListForInstitutions(): Promise<OptionItemDto[]> {
    try {
      const response = await this.apiClient.get(
        "institution/education-program/programs-list",
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
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
    await this.patchCall(
      `institution/education-program/${programId}/institution/${institutionId}/approve/aest`,
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
    await this.patchCall(
      `institution/education-program/${programId}/institution/${institutionId}/decline/aest`,
      payload,
    );
  }
}
