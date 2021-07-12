import HttpBaseClient from "./common/HttpBaseClient";
import {
  StudentInfo,
  StudentContact,
  StudentProfile,
  ProgramYear,
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

  public async getProgramYears(): Promise<ProgramYear> {
    const response = await this.apiClient.get(
      "students/program-year",
      this.addAuthHeader(),
    );
    const programYear = response.data as ProgramYear;
    return programYear;
  }
}
