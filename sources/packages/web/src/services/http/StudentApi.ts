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

export const MISSING_STUDENT_ACCOUNT = "MISSING_STUDENT_ACCOUNT";

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

  /**
   * Updates the student information that the student is allowed to change
   * in the solution. Other data must be edited outside (e.g. BCSC).
   * @param studentContact information to be updated.
   */
  async updateStudentContact(studentContact: StudentContact): Promise<void> {
    await this.apiClient.patch(this.addClientRoot("students"), studentContact);
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

  /**
   * Get the student information that represents the profile.
   * @param studentId student id to retrieve the data. Required
   * only when not logged as a student.
   * @returns student profile details.
   */
  async getStudentProfile(
    studentId?: number,
  ): Promise<StudentProfileAPIOutDTO> {
    return this.getCallTyped<StudentProfileAPIOutDTO>(
      this.addClientRoot(`students/${studentId ?? ""}`),
    );
  }

  /**
   * Use the information available in the authentication token to update
   * the user and student data currently on DB.
   * If the user account does not exists an API custom error will be returned
   * from the API with the error code MISSING_STUDENT_ACCOUNT.
   */
  public async synchronizeFromUserToken(): Promise<void> {
    try {
      await this.patchCall(this.addClientRoot("students/sync"), null, true);
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }

  /**
   * Creates the request for ATBC PD evaluation.
   * Student should only be allowed to check the PD status once and the
   * SIN validation must be already done with a successful result.
   */
  async applyForPDStatus(): Promise<void> {
    await this.patchCall(this.addClientRoot("students/apply-pd-status"), null);
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
    const url = this.addClientRoot(
      `students/search?${queryString.slice(0, -1)}`,
    );
    return await this.getCallTyped<SearchStudentResp[]>(
      url,
      this.addAuthHeader(),
    );
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
