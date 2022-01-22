import {
  SummaryEducationProgramDto,
  EducationProgramDto,
  OptionItemDto,
  StudentEducationProgramDto,
} from "../../types";
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

  public async getLocationProgramsSummary(
    locationId: number,
  ): Promise<SummaryEducationProgramDto[]> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/location/${locationId}/summary`,
        this.addAuthHeader(),
      );
      return response.data as SummaryEducationProgramDto[];
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getEducationProgram(
    programId: number,
  ): Promise<EducationProgramDto> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/${programId}/details`,
        this.addAuthHeader(),
      );
      return response.data as EducationProgramDto;
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
  ): Promise<EducationProgramDto> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/${programId}/aest`,
        this.addAuthHeader(),
      );
      return response.data as EducationProgramDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
