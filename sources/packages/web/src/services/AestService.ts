import ApiClient from "@/services/http/ApiClient";
import {
  StudentDetail,
  SearchStudentResp,
} from "@/types/contracts/aest/AestContract";

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
    return ApiClient.MinistryApi.searchStudents(appNumber, firstName, lastName);
  }

  /**
   *
   * @param studentId
   * @returns
   */
  async getStudentDetail(studentId: number): Promise<StudentDetail> {
    return ApiClient.MinistryApi.getStudentDetail(studentId);
  }
}
