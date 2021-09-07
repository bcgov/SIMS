import {
  SummaryEducationProgramDto,
  EducationProgramDto,
  OptionItemDto,
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

  public async getInstitutionType(): Promise<number> {
    try {
      const response = await this.apiClient.get(
        `institution/intitution-type`,
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
        `institution/education-program/${programId}/summary`,
        this.addAuthHeader(),
      );
      return response.data as EducationProgramDto;
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
  ): Promise<OptionItemDto[]> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/location/${locationId}/options-list`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Gets location programs list authorized for institutions.
   * @param locationId location id.
   * @returns location programs list for institutions.
   */
  public async getLocationProgramsListForInstitutions(
    locationId: number,
  ): Promise<OptionItemDto[]> {
    try {
      const response = await this.apiClient.get(
        `institution/education-program/location/${locationId}/programs-list`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
