import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  AESTFileUploadToStudentAPIInDTO,
  AESTStudentFileAPIOutDTO,
  InstitutionStudentFileAPIOutDTO,
  CreateStudentAPIInDTO,
  SearchStudentAPIOutDTO,
  StudentFileUploaderAPIInDTO,
  StudentProfileAPIOutDTO,
  StudentUploadFileAPIOutDTO,
  UpdateStudentAPIInDTO,
  SINValidationsAPIOutDTO,
  CreateSINValidationAPIInDTO,
  UpdateSINValidationAPIInDTO,
  SearchStudentAPIInDTO,
} from "@/services/http/dto";

export class StudentApi extends HttpBaseClient {
  /**
   * Creates the student checking for an existing user to be used or
   * creating a new one in case the user id is not provided.
   * The user could be already available in the case of the same user
   * was authenticated previously on another portal (e.g. parent/partner).
   * @param studentProfile information needed to create the user.
   */
  async createStudent(studentProfile: CreateStudentAPIInDTO): Promise<void> {
    await this.postCall(this.addClientRoot("student"), studentProfile);
  }

  /**
   * Updates the student information that the student is allowed to change
   * in the solution. Other data must be edited externally (e.g. BCSC).
   * @param studentContact information to be updated.
   */
  async updateStudentContact(
    studentContact: UpdateStudentAPIInDTO,
  ): Promise<void> {
    await this.patchCall(this.addClientRoot("student"), studentContact);
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
    return this.getCall<StudentProfileAPIOutDTO>(
      this.addClientRoot(`student/${studentId ?? ""}`),
    );
  }

  /**
   * Use the information available in the authentication token to update
   * the user and student data currently on DB.
   * If the user account does not exists an API custom error will be returned
   * from the API with the error code MISSING_STUDENT_ACCOUNT.
   */
  public async synchronizeFromUserToken(): Promise<void> {
    await this.patchCall(this.addClientRoot("student/sync"), null);
  }

  /**
   * Creates the request for ATBC PD evaluation.
   * Student should only be allowed to check the PD status once and the
   * SIN validation must be already done with a successful result.
   */
  async applyForPDStatus(): Promise<void> {
    await this.patchCall(this.addClientRoot("atbc/apply-pd-status"), null);
  }

  /**
   * Search students based on the search criteria.
   * @param payload search criteria.
   * @returns searched student details.
   */
  async searchStudents(
    payload: SearchStudentAPIInDTO,
  ): Promise<SearchStudentAPIOutDTO[]> {
    return this.postCall(this.addClientRoot("student/search"), payload);
  }

  /**
   * save student files from student form uploader.
   * @param studentFilesPayload
   */
  async saveStudentFiles(
    studentFilesPayload: StudentFileUploaderAPIInDTO,
  ): Promise<void> {
    await this.patchCall<StudentFileUploaderAPIInDTO>(
      this.addClientRoot("student/save-uploaded-files"),
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
      this.addClientRoot(`student/${studentId}/save-uploaded-files`),
      payload,
    );
  }

  /**
   * Get all student documents uploaded by student uploader.
   * @return list of student documents.
   */
  async getStudentFiles(): Promise<StudentUploadFileAPIOutDTO[]> {
    return this.getCall<StudentUploadFileAPIOutDTO[]>(
      this.addClientRoot("student/documents"),
    );
  }

  /**
   * Get all student documents uploaded by student uploader.
   * @return list of student documents.
   */
  async getAESTStudentFiles(
    studentId: number,
  ): Promise<AESTStudentFileAPIOutDTO[]> {
    return this.getCall<AESTStudentFileAPIOutDTO[]>(
      this.addClientRoot(`student/${studentId}/documents`),
    );
  }

  /**
   * Get all student documents uploaded by student uploader.
   * @return list of student documents.
   */
  async getInstitutionStudentFiles(
    studentId: number,
  ): Promise<InstitutionStudentFileAPIOutDTO[]> {
    return this.getCall<InstitutionStudentFileAPIOutDTO[]>(
      this.addClientRoot(`student/${studentId}/documents`),
    );
  }

  /**
   * Get the SIN validations associated with the student user.
   * @param studentId student to retrieve the SIN validations.
   * @returns the history of SIN validations associated with the student user.
   */
  async getStudentSINValidations(
    studentId: number,
  ): Promise<SINValidationsAPIOutDTO[]> {
    return this.getCall<SINValidationsAPIOutDTO[]>(
      this.addClientRoot(`student/${studentId}/sin-validations`),
    );
  }

  /**
   * Creates a new SIN validation entry associated with the student user.
   * This entry will be updated in the student record as the one that represents
   * the current state of the SIN validation.
   * @param studentId student to have the SIN validation created.
   * @returns newly created record id.
   */
  async createStudentSINValidation(
    studentId: number,
    payload: CreateSINValidationAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot(`student/${studentId}/sin-validations`),
      payload,
    );
  }

  /**
   * Updates the SIN validation expiry date for temporary SIN.
   * @param studentId student to have the SIN validation updated.
   * @param sinValidationId SIN validation record to be updated.
   * @param payload data to be updated.
   */
  async updateStudentSINValidation(
    studentId: number,
    sinValidationId: number,
    payload: UpdateSINValidationAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(
        `student/${studentId}/sin-validations/${sinValidationId}`,
      ),
      payload,
    );
  }
}
