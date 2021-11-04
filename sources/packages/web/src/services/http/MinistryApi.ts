import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  StudentDetail,
  SearchStudentResp,
} from "@/types/contracts/aest/AestContract";

export class MinistryApi extends HttpBaseClient {
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

  public async getStudentDetail(studentId: number): Promise<StudentDetail> {
    const response = await this.getCall(`students/aest/${studentId}`);
    const studentInfo = response.data as StudentDetail;
    return studentInfo;
  }
}
