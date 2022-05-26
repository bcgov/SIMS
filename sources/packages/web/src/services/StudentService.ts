import ApiClient from "@/services/http/ApiClient";
import {
  StudentContact,
  CreateStudent,
  StudentFormInfo,
  StudentApplicationAndCount,
  SearchStudentResp,
  DataTableSortOrder,
  StudentApplicationFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  ApiProcessError,
  StudentRestrictionAPIOutDTO,
} from "@/types";
import { useFormatters } from "@/composables";
import {
  AESTFileUploadToStudentAPIInDTO,
  AESTStudentFileAPIOutDTO,
  StudentFileUploaderAPIInDTO,
  StudentUploadFileAPIOutDTO,
} from "./http/dto/Student.dto";
import { AxiosResponse } from "axios";

export class StudentService {
  // Share Instance
  private static instance: StudentService;

  public static get shared(): StudentService {
    return this.instance || (this.instance = new this());
  }

  async createStudent(student: CreateStudent): Promise<void> {
    await ApiClient.Students.createStudent(student);
  }

  async updateStudent(contact: StudentContact): Promise<void> {
    await ApiClient.Students.updateStudentContact(contact);
  }

  public async getContact(): Promise<StudentContact> {
    const studentContact = await ApiClient.Students.getContact();
    return studentContact;
  }

  /**
   * Get the student information that represents the profile.
   * @param studentId student id to retrieve the data. Required
   * only when not logged as a student.
   * @returns student profile details.
   */
  async getStudentProfile(studentId?: number): Promise<StudentFormInfo> {
    const { dateOnlyLongString } = useFormatters();
    const studentProfile = await ApiClient.Students.getStudentProfile(
      studentId,
    );
    const studentInfoAll = {
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
  async synchronizeFromUserToken(): Promise<boolean> {
    try {
      await ApiClient.Students.synchronizeFromUserToken();
      return true;
    } catch (error: unknown) {
      // TODO: Get MISSING_STUDENT_ACCOUNT /services/http/StudentApi.ts, It was remove for now as it was throwing "Super expression must either be null or a function, not undefined" error
      if (
        error instanceof ApiProcessError &&
        error.errorType === "MISSING_STUDENT_ACCOUNT"
      ) {
        return false;
      }
      throw error;
    }
  }

  async applyForPDStatus(): Promise<void> {
    return ApiClient.Students.applyForPDStatus();
  }

  /**
   * Get all the applications for a student
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageCount, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns StudentApplicationAndCount
   */
  async getAllStudentApplications(
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    sortField?: StudentApplicationFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<StudentApplicationAndCount> {
    return ApiClient.Application.getAllApplicationAndCountForStudent(
      page,
      pageCount,
      sortField,
      sortOrder,
    );
  }

  /**
   * TODO: This service is called to restriction update states, in future restriction UI ticket
   * API client to call the student restriction rest API.
   * @returns student restriction(wrapped by promise)
   */
  async getStudentRestriction(): Promise<StudentRestrictionAPIOutDTO[]> {
    return ApiClient.Students.getStudentRestriction();
  }

  /**
   * Search students for ministry search page.
   * @param appNumber
   * @param firstName
   * @param lastName
   * @returns SearchStudentResp[]
   */
  async searchStudents(
    appNumber: string,
    firstName: string,
    lastName: string,
  ): Promise<SearchStudentResp[]> {
    return ApiClient.Students.searchStudents(appNumber, firstName, lastName);
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
   * Get all student documents for AEST user.
   * @return list of student documents.
   */
  async getAESTStudentFiles(
    studentId: number,
  ): Promise<AESTStudentFileAPIOutDTO[]> {
    return ApiClient.Students.getAESTStudentFiles(studentId);
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
    return ApiClient.FileUpload.download(`students/files/${uniqueFileName}`);
  }
}
