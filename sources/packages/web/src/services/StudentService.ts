import ApiClient from "@/services/http/ApiClient";
import Helper from "@/helpers/utilfunctions";
import {
  StudentContact,
  CreateStudent,
  StudentFormInfo,
  StudentApplication,
  StudentRestrictionStatus,
} from "@/types/contracts/StudentContract";

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

  async getAllStudentApplications(): Promise<StudentApplication[]> {
    return ApiClient.Students.getAllStudentApplications();
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
}
