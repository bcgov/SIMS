import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  StudentInfo,
  StudentContact,
  StudentProfile,
  StudentRestrictionStatus,
  SearchStudentResp,
  StudentDetail,
  StudentFileUploaderDto,
  StudentUploadFileDto,
} from "@/types/contracts/StudentContract";

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

  public async checkStudent(): Promise<boolean> {
    try {
      const result = await this.apiClient.get(
        "students/check-student",
        this.addAuthHeader(),
      );
      return result?.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * API client to call the student restriction rest API.
   * @returns student restriction(wrapped by promise)
   */
  public async getStudentRestriction(): Promise<StudentRestrictionStatus> {
    try {
      const response = await this.getCall("students/restriction");
      return response.data as StudentRestrictionStatus;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

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
    const response = await this.getCall(`students/${studentId}/aest`);
    return response.data as StudentDetail;
  }

  /**
   * save student files from student form uploader.
   * @param studentFilesPayload
   */
  async saveStudentFiles(
    studentFilesPayload: StudentFileUploaderDto,
  ): Promise<void> {
    await this.patchCall<StudentFileUploaderDto>(
      "students/upload-files",
      studentFilesPayload,
    );
  }

  /**
   * Get all student documents uploaded by student uploader.
   * @return StudentUploadFileDto[] list of student documents
   */
  async getStudentFiles(studentId?: number): Promise<StudentUploadFileDto[]> {
    try {
      let queryString = "";
      if (studentId) {
        queryString += `?studentId=${studentId}`;
      }
      return this.getCallTyped<StudentUploadFileDto[]>(
        `students/documents${queryString}`,
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
