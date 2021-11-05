import ApiClient from "@/services/http/ApiClient";
import {
  StudentDetail,
  SearchStudentResp,
  GetApplicationDataDto,
} from "@/types";

export class AestService {
  // Share Instance
  private static instance: AestService;

  public static get shared(): AestService {
    return this.instance || (this.instance = new this());
  }
  /**
   * Search students for ministry search page.
   * @param appNumber
   * @param firstName
   * @param lastName
   * @returns
   */
  async searchStudents(
    appNumber: string,
    firstName: string,
    lastName: string,
  ): Promise<SearchStudentResp[]> {
    return ApiClient.AestApi.searchStudents(appNumber, firstName, lastName);
  }

  /**
   *
   * @param studentId
   * @returns
   */
  async getStudentDetail(studentId: number): Promise<StudentDetail> {
    return ApiClient.AestApi.getStudentDetail(studentId);
  }

  /**
   *
   * @param applicationId
   * @param userId
   * @returns
   */
  async getApplicationDetail(
    applicationId: number,
    studentId: number,
  ): Promise<GetApplicationDataDto> {
    return ApiClient.AestApi.getApplicationDetails(applicationId, studentId);
  }
}
