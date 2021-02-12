import { student } from "@/store/modules/student/student";
import HttpBaseClient from "./common/HttpBaseClient";
import { StudentConfirmInfo } from "./contracts/StudentContract";

export interface StudentProfile {
  phone: string;
  sinNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export interface StudentContact {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

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

  //Api call to get Student Confirmation Data
  public async getStudentConfirmInfo() {
    const response = await this.getCall("students/studentConfirmInfo");
    const studentConfirmInfo = response.data as StudentConfirmInfo;
    return studentConfirmInfo;
  }

  public async synchronizeFromUserInfo(): Promise<void> {
    try {
      await this.apiClient.patch("students/sync", null, this.addAuthHeader());
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
