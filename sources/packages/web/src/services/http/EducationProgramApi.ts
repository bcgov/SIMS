import {
  SummaryEducationProgramDto,
  OptionItemDto,
  StudentEducationProgramDto,
  EducationProgramData,
  DataTableSortOrder,
  ProgramSummaryFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  FieldSortOrder,
  PaginatedResults,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class EducationProgramApi extends HttpBaseClient {
  public async getProgram(programId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/${programId}`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async createProgram(createProgramDto: any): Promise<void> {
    try {
      await this.apiClient.post(
        "institution/education-program",
        createProgramDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateProgram(
    programId: number,
    updateProgramDto: any,
  ): Promise<void> {
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
    sortField?: ProgramSummaryFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<SummaryEducationProgramDto>> {
    try {
      let URL = `institution/education-program/location/${locationId}/summary?page=${page}&pageLimit=${pageCount}`;
      if (searchProgramName) {
        URL = `${URL}&searchProgramName=${searchProgramName}`;
      }
      if (sortField && sortOrder) {
        const sortDBOrder =
          sortOrder === DataTableSortOrder.DESC
            ? FieldSortOrder.DESC
            : FieldSortOrder.ASC;
        URL = `${URL}&sortField=${sortField}&sortOrder=${sortDBOrder}`;
      }
      const response = await this.apiClient.get(URL, this.addAuthHeader());
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramData> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/${programId}/details`,
        this.addAuthHeader(),
      );
      return response.data as EducationProgramData;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getStudentEducationProgram(
    programId: number,
  ): Promise<StudentEducationProgramDto> {
    try {
      const response = await this.apiClient.get(
        `students/education-program/${programId}`,
        this.addAuthHeader(),
      );
      return response.data as StudentEducationProgramDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
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
    try {
      let url = `institution/education-program/location/${locationId}/program-year/${programYearId}/options-list`;
      if (includeInActivePY) {
        url = `${url}?includeInActivePY=${includeInActivePY}`;
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
  public async getProgramsListForInstitutions(): Promise<OptionItemDto[]> {
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
   * Education Program Details for ministry users
   * @param programId program id
   * @returns Education Program Details
   */
  public async getEducationProgramForAEST(
    programId: number,
  ): Promise<EducationProgramData> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/${programId}/aest`,
        this.addAuthHeader(),
      );
      return response.data as EducationProgramData;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
