import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  StudentContact,
  CreateStudent,
  StudentRestrictionStatus,
  SearchStudentResp,
} from "@/types/contracts/StudentContract";
import {
  AESTFileUploadToStudentAPIInDTO,
  AESTStudentFileAPIOutDTO,
  StudentFileUploaderAPIInDTO,
  StudentProfileAPIOutDTO,
  StudentUploadFileAPIOutDTO,
} from "./dto/Student.dto";

export class StudentApi extends HttpBaseClient {
  async createStudent(studentProfile: CreateStudent): Promise<void> {
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

  async updateStudentContact(studentContact: StudentContact): Promise<void> {
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

  async getContact(): Promise<StudentContact> {
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

  async getStudentProfile(): Promise<StudentProfileAPIOutDTO> {
    return this.getCallTyped<StudentProfileAPIOutDTO>(
      this.addClientRoot("students"),
    );
  }

  async getAESTStudentProfile(
    studentId: number,
  ): Promise<StudentProfileAPIOutDTO> {
    return this.getCallTyped<StudentProfileAPIOutDTO>(
      this.addClientRoot(`students/${studentId}`),
    );
  }

  async synchronizeFromUserInfo(): Promise<void> {
    try {
      await this.apiClient.patch("students/sync", null, this.addAuthHeader());
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  async applyForPDStatus(): Promise<void> {
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

  async checkStudent(): Promise<boolean> {
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
  async getStudentRestriction(): Promise<StudentRestrictionStatus> {
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
  async searchStudents(
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
   * save student files from student form uploader.
   * @param studentFilesPayload
   */
  async saveStudentFiles(
    studentFilesPayload: StudentFileUploaderAPIInDTO,
  ): Promise<void> {
    await this.patchCall<StudentFileUploaderAPIInDTO>(
      this.addClientRoot("students/save-uploaded-files"),
      studentFilesPayload,
    );
  }

  /**
   * Saves the files submitted by the Ministry to the student.
   * All the files uploaded are first saved as temporary file in
   * the DB. When this endpoint is called, the temporary
   * files (saved during the upload) are updated to its proper
   * group and file origin.
   * @param studentId student to have the file saved.
   * @param payload list of files to be saved.
   */
  async saveAESTUploadedFilesToStudent(
    studentId: number,
    payload: AESTFileUploadToStudentAPIInDTO,
  ): Promise<void> {
    await this.patchCall<AESTFileUploadToStudentAPIInDTO>(
      this.addClientRoot(`students/${studentId}/save-uploaded-files`),
      payload,
    );
  }

  /**
   * Get all student documents uploaded by student uploader.
   * @return list of student documents.
   */
  async getStudentFiles(): Promise<StudentUploadFileAPIOutDTO[]> {
    return this.getCallTyped<StudentUploadFileAPIOutDTO[]>(
      this.addClientRoot("students/documents"),
    );
  }

  /**
   * Get all student documents uploaded by student uploader.
   * @return list of student documents.
   */
  async getAESTStudentFiles(
    studentId: number,
  ): Promise<AESTStudentFileAPIOutDTO[]> {
    return this.getCallTyped<AESTStudentFileAPIOutDTO[]>(
      this.addClientRoot(`students/${studentId}/documents`),
    );
  }
}
