import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  StudentDetail,
  SearchStudentResp,
  GetApplicationDataDto,
} from "@/types";

/**
 * API client for Ministry APIs
 */
export class AestApi extends HttpBaseClient {
  /**
   * API client for student search.
   * @param appNumber
   * @param firstName
   * @param lastName
   * @returns
   */
  public async searchStudents(
    appNumber: string,
    firstName: string,
    lastName: string,
  ): Promise<SearchStudentResp[]> {
    try {
      let queryString = "";
      if (appNumber) {
        queryString += `appNumber=${appNumber}&`;
      }
      if (firstName) {
        queryString += `firstName=${firstName}&`;
      }
      if (lastName) {
        queryString += `lastName=${lastName}&`;
      }
      const student = await this.apiClient.get(
        `students/search?${queryString.slice(0, -1)}`,
        this.addAuthHeader(),
      );
      return student.data as SearchStudentResp[];
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * API Client for student detail.
   * @param studentId
   * @returns
   */
  public async getStudentDetail(studentId: number): Promise<StudentDetail> {
    const response = await this.getCall(`students/aest/${studentId}`);
    return response.data as StudentDetail;
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
  ): Promise<GetApplicationDataDto> {
    const response = await this.getCall(
      `application/aest/${applicationId}/${studentId}`,
    );
    return response.data as GetApplicationDataDto;
  }
}
