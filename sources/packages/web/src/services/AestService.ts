import ApiClient from "@/services/http/ApiClient";
import {
  StudentDetail,
  SearchStudentResp,
  GetApplicationDataDto,
} from "@/types";
/**
 * Client Service layer for Ministry APIs
 */
export class AestService {
  // Shared Instance
  private static instance: AestService;

  public static get shared(): AestService {
    return this.instance || (this.instance = new this());
  }
  /**
   * Search students for ministry search page.
   * @param appNumber
   * @param firstName
   * @param lastName
   * @returns SearchStudentResp[]
   */
  async searchStudents(
    appNumber: string,
    firstName: string,
    lastName: string,
  ): Promise<SearchStudentResp[]> {
    return ApiClient.AestApi.searchStudents(appNumber, firstName, lastName);
  }

  /**
   * Get student details of given student.
   * @param studentId
   * @returns StudentDetail
   */
  async getStudentDetail(studentId: number): Promise<StudentDetail> {
    return ApiClient.AestApi.getStudentDetail(studentId);
  }

  /**
   * Get application detail of given application
   * @param applicationId
   * @param userId
   * @returns GetApplicationDataDto
   */
  async getApplicationDetail(
    applicationId: number,
    studentId: number,
  ): Promise<GetApplicationDataDto> {
    return ApiClient.AestApi.getApplicationDetails(applicationId, studentId);
  }
}
