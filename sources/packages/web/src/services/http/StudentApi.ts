import HttpBaseClient from "./common/HttpBaseClient";
import {
  StudentInfo,
  StudentContact,
  StudentProfile,
  StudentApplication,
  SearchStudentResp,
} from "../../types/contracts/StudentContract";

export class StudentApi extends HttpBaseClient {
  public async createStudent(studentProfile: StudentProfile): Promise<void> {
    try {
      await this.apiClient.post(
        "students",
        studentProfile,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateStudentContact(
    studentContact: StudentContact,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        "students/contact",
        studentContact,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

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

  public async getContact(): Promise<StudentContact> {
    try {
      const studentContact = await this.apiClient.get(
        "students/contact",
        this.addAuthHeader(),
      );
      return studentContact.data as StudentContact;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  //Api call to get Student Data
  public async getStudentInfo(): Promise<StudentInfo> {
    const response = await this.getCall("students/studentInfo");
    const studentInfo = response.data as StudentInfo;
    return studentInfo;
  }

  public async synchronizeFromUserInfo(): Promise<void> {
    try {
      await this.apiClient.patch("students/sync", null, this.addAuthHeader());
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async applyForPDStatus(): Promise<void> {
    try {
      return await this.apiClient.patch(
        "students/apply-pd-status",
        null,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getAllStudentApplications(): Promise<StudentApplication[]> {
    try {
      const result = await this.apiClient.get(
        "students/application-summary",
        this.addAuthHeader(),
      );
      return result?.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
