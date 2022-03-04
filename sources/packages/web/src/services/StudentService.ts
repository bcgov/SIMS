import ApiClient from "@/services/http/ApiClient";
import Helper from "@/helpers/utilfunctions";
import {
  StudentContact,
  CreateStudent,
  StudentFormInfo,
  StudentApplicationAndCount,
  StudentRestrictionStatus,
  SearchStudentResp,
  StudentDetail,
  DataTableSortOrder,
  StudentApplicationFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  FieldSortOrder,
  StudentFileUploaderDto,
  StudentUploadedFileDto,
} from "@/types";

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

  async getStudentInfo(): Promise<StudentFormInfo> {
    const studentInfo = await ApiClient.Students.getStudentInfo();
    const studentInfoAll = {
      ...studentInfo,
      //Formatting date received from api from 1998-03-24T00:00:00.000Z to March 24, 1998
      birthDateFormatted: Helper.formatDate(studentInfo.dateOfBirth),
      //Formatting date received from api from 1998-03-24T00:00:00.000Z to "1998-03-24"
      birthDateFormatted2: Helper.formatDate2(studentInfo.dateOfBirth),
    };
    return studentInfoAll;
  }

  /**
   * Client method to call inorder to update the student
   * information using the user information.
   */
  async synchronizeFromUserInfo(): Promise<void> {
    return await ApiClient.Students.synchronizeFromUserInfo();
  }

  async applyForPDStatus(): Promise<void> {
    return ApiClient.Students.applyForPDStatus();
  }

  /**
   * Get all the applications for a student
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageLimit, limit of the page if nothing is
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
    let URL = `students/application-summary?page=${page}&pageLimit=${pageCount}`;
    if (sortField && sortOrder) {
      const sortDBOrder =
        sortOrder === DataTableSortOrder.DESC
          ? FieldSortOrder.DESC
          : FieldSortOrder.ASC;
      URL = `${URL}&sortField=${sortField}&sortOrder=${sortDBOrder}`;
    }
    return ApiClient.Application.getAllApplicationAndCount(URL);
  }

  public async checkStudent(): Promise<boolean> {
    return ApiClient.Students.checkStudent();
  }

  /**
   * API client to call the student restriction rest API.
   * @returns student restriction(wrapped by promise)
   */
  async getStudentRestriction(): Promise<StudentRestrictionStatus> {
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
   * Get student details of given student.
   * @param studentId
   * @returns StudentDetail
   */
  async getStudentDetail(studentId: number): Promise<StudentDetail> {
    return ApiClient.Students.getStudentDetail(studentId);
  }

  /**
   * save student files from student form uploader.
   * @param studentFilesPayload
   */
  async saveStudentFiles(
    studentFilesPayload: StudentFileUploaderDto,
  ): Promise<void> {
    await ApiClient.Students.saveStudentFiles(studentFilesPayload);
  }

  /**
   * Get all student documents uploaded by student uploader.
   * @return StudentUploadedFileDto[] list of student documents
   */
  async getStudentFiles(): Promise<StudentUploadedFileDto[]> {
    return ApiClient.Students.getStudentFiles();
  }

  /**
   * Get all student documents uploaded by student uploader.
   * @param uniqueFileName uniqueFileName
   * @return
   */
  async downloadStudentFile(uniqueFileName: string): Promise<string> {
    const blobObject = await ApiClient.FileUpload.download(
      `students/files/${uniqueFileName}`,
    );
    return window.URL.createObjectURL(blobObject);
  }
}
