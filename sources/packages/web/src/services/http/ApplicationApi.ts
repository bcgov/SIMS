import {
  SaveStudentApplicationDto,
  ProgramYearOfApplicationDto,
  ApplicationStatusToBeUpdatedDto,
  GetApplicationDataDto,
  GetApplicationBaseDTO,
  StudentApplicationAndCount,
  NoticeOfAssessmentDTO,
} from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";

export class ApplicationApi extends HttpBaseClient {
  public async getApplicationData(applicationId: number): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `application/${applicationId}`,
        this.addAuthHeader(),
      );
      return response.data as GetApplicationDataDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Retrieve the Notice of Assessment (NOA) for a particular application.
   */
  public async getNOA(applicationId: number): Promise<NoticeOfAssessmentDTO> {
    try {
      const response = await this.apiClient.get(
        `application/${applicationId}/assessment`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async confirmAssessment(applicationId: number): Promise<void> {
    try {
      await this.apiClient.patch(
        `application/${applicationId}/confirm-assessment`,
        {},
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateStudentApplicationStatus(
    applicationId: number,
    payload: ApplicationStatusToBeUpdatedDto,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `application/${applicationId}/status`,
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async createApplicationDraft(
    payload: SaveStudentApplicationDto,
  ): Promise<number> {
    try {
      const response = await this.apiClient.post(
        "application/draft",
        payload,
        this.addAuthHeader(),
      );
      return +response.data;
    } catch (error) {
      if (!error.response.data?.errorType) {
        // If it is an not expected error,
        // handle it the default way.
        this.handleRequestError(error);
      }

      throw error;
    }
  }

  public async saveApplicationDraft(
    applicationId: number,
    payload: SaveStudentApplicationDto,
  ): Promise<number> {
    try {
      const response = await this.apiClient.patch(
        `application/${applicationId}/draft`,
        payload,
        this.addAuthHeader(),
      );
      return +response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async submitApplication(
    applicationId: number,
    payload: SaveStudentApplicationDto,
  ): Promise<void> {
    try {
      return await this.apiClient.patch(
        `application/${applicationId}/submit`,
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getProgramYearOfApplication(
    applicationId: number,
  ): Promise<ProgramYearOfApplicationDto> {
    try {
      const response = await this.apiClient.get(
        `application/${applicationId}/program-year`,
        this.addAuthHeader(),
      );
      return response.data as ProgramYearOfApplicationDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * API Client for application detail.
   * @param applicationId
   * @param userId
   * @returns
   */
  public async getApplicationDetails(
    applicationId: number,
    studentId: number,
  ): Promise<GetApplicationBaseDTO> {
    const response = await this.getCall(
      `application/${applicationId}/student/${studentId}/aest`,
    );
    return response.data as GetApplicationBaseDTO;
  }

  /**
   * API Client for applications of a student.
   * @param url to be sent
   * @returns
   */
  public async getAllApplicationsForStudent(
    url: string,
  ): Promise<StudentApplicationAndCount> {
    const response = await this.getCall(url);
    return response.data as StudentApplicationAndCount;
  }
}
