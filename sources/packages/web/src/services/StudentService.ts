import ApiClient from "@/services/http/ApiClient";
import { StudentProfile, SINValidations } from "@/types";
import { useFormatters } from "@/composables";
import {
  AESTFileUploadToStudentAPIInDTO,
  StudentFileDetailsAPIOutDTO,
  CreateStudentAPIInDTO,
  SearchStudentAPIOutDTO,
  StudentFileUploaderAPIInDTO,
  StudentUploadFileAPIOutDTO,
  UpdateStudentAPIInDTO,
  CreateSINValidationAPIInDTO,
  UpdateSINValidationAPIInDTO,
  SearchStudentAPIInDTO,
  UpdateDisabilityStatusAPIInDTO,
} from "@/services/http/dto";
import { AxiosResponse } from "axios";

export class StudentService {
  // Share Instance
  private static instance: StudentService;

  public static get shared(): StudentService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Creates the student checking for an existing user to be used or
   * creating a new one in case the user id is not provided.
   * The user could be already available in the case of the same user
   * was authenticated previously on another portal (e.g. parent/partner).
   * @param student information needed to create the user.
   */
  async createStudent(student: CreateStudentAPIInDTO): Promise<void> {
    await ApiClient.Students.createStudent(student);
  }

  /**
   * Updates the student information that the student is allowed to change
   * in the solution. Other data must be edited externally (e.g. BCSC).
   * @param contact information to be updated.
   */
  async updateStudent(contact: UpdateStudentAPIInDTO): Promise<void> {
    await ApiClient.Students.updateStudentContact(contact);
  }

  /**
   * Get the student information that represents the profile.
   * @param studentId student id to retrieve the data. Required
   * only when not logged as a student.
   * @returns student profile details.
   */
  async getStudentProfile(studentId?: number): Promise<StudentProfile> {
    const { dateOnlyLongString } = useFormatters();
    const studentProfile = await ApiClient.Students.getStudentProfile(
      studentId,
    );
    const studentInfoAll: StudentProfile = {
      ...studentProfile,
      birthDateFormatted: dateOnlyLongString(studentProfile.dateOfBirth),
    };
    return studentInfoAll;
  }

  /**
   * Use the information available in the authentication token to update
   * the user and student data currently on DB.
   * If the user account does not exists an API custom error will be returned
   * from the API with the error code MISSING_STUDENT_ACCOUNT.
   * @returns true if the student account was found and updated, otherwise false
   * if the student account is missing.
   */
  async synchronizeFromUserToken(): Promise<void> {
    await ApiClient.Students.synchronizeFromUserToken();
  }

  async applyForDisabilityStatus(): Promise<void> {
    await ApiClient.Students.applyForDisabilityStatus();
  }

  /**
   * Search students for ministry search page.
   * @param payload search criteria.
   * @returns student search results.
   */
  async searchStudents(
    payload: SearchStudentAPIInDTO,
  ): Promise<SearchStudentAPIOutDTO[]> {
    return ApiClient.Students.searchStudents(payload);
  }

  /**
   * save student files from student form uploader.
   * @param studentFilesPayload
   */
  async saveStudentFiles(
    studentFilesPayload: StudentFileUploaderAPIInDTO,
  ): Promise<void> {
    await ApiClient.Students.saveStudentFiles(studentFilesPayload);
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
    await ApiClient.Students.saveAESTUploadedFilesToStudent(studentId, payload);
  }

  /**
   * Get all student documents uploaded by student uploader.
   * @return list of student documents.
   */
  async getStudentFiles(): Promise<StudentUploadFileAPIOutDTO[]> {
    return ApiClient.Students.getStudentFiles();
  }

  /**
   * Get all student documents.
   * @param studentId student id.
   * @return list of student documents.
   */
  async getStudentFileDetails(
    studentId: number,
  ): Promise<StudentFileDetailsAPIOutDTO[]> {
    return ApiClient.Students.getStudentFileDetails(studentId);
  }

  /**
   * This method is to get the requested student document.
   * `FileUpload.download` will return the blob object of
   * the requested file upon proper authentication.
   * and with blob object, blob url is created for the href,
   * and its is returned
   * @param uniqueFileName uniqueFileName
   * @return axios response object from http response.
   */
  async downloadStudentFile(
    uniqueFileName: string,
  ): Promise<AxiosResponse<any>> {
    return await ApiClient.FileUpload.download(
      `student/files/${uniqueFileName}`,
    );
  }

  /**
   * Get the SIN validations associated with the student user.
   * @param studentId student to retrieve the SIN validations.
   * @returns the history of SIN validations associated with the student user.
   */
  async getStudentSINValidations(studentId: number): Promise<SINValidations[]> {
    const {
      dateOnlyLongString,
      yesNoFlagDescription,
      booleanToYesNo,
      sinDisplayFormat,
    } = useFormatters();
    const sinValidations = await ApiClient.Students.getStudentSINValidations(
      studentId,
    );
    return sinValidations?.map((sinValidation) => ({
      ...sinValidation,
      sinFormatted: sinDisplayFormat(sinValidation.sin),
      createdAtFormatted: dateOnlyLongString(sinValidation.createdAt),
      isValidSINFormatted: booleanToYesNo(sinValidation.isValidSIN),
      validSINCheckFormatted: yesNoFlagDescription(sinValidation.validSINCheck),
      validBirthdateCheckFormatted: yesNoFlagDescription(
        sinValidation.validBirthdateCheck,
      ),
      validFirstNameCheckFormatted: yesNoFlagDescription(
        sinValidation.validFirstNameCheck,
      ),
      validLastNameCheckFormatted: yesNoFlagDescription(
        sinValidation.validLastNameCheck,
      ),
      validGenderCheckFormatted: yesNoFlagDescription(
        sinValidation.validGenderCheck,
      ),
      sinExpiryDateFormatted: dateOnlyLongString(sinValidation.sinExpiryDate),
    }));
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
    await ApiClient.Students.createStudentSINValidation(studentId, payload);
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
    await ApiClient.Students.updateStudentSINValidation(
      studentId,
      sinValidationId,
      payload,
    );
  }

  /**
   * Update student disability status with note.
   * @param studentId student id.
   * @param payload update disability status payload.
   */
  async updateDisabilityStatus(
    studentId: number,
    payload: UpdateDisabilityStatusAPIInDTO,
  ): Promise<void> {
    await ApiClient.Students.updateDisabilityStatus(studentId, payload);
  }
}
