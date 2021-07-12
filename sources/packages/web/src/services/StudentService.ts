import ApiClient from "./http/ApiClient";
import Helper from "../helpers/utilfunctions";
import {
  StudentContact,
  CreateStudent,
} from "../types/contracts/StudentContract";

export class StudentService {
  // Share Instance
  private static instance: StudentService;

  public static get shared(): StudentService {
    return this.instance || (this.instance = new this());
  }

  async createStudent(student: CreateStudent): Promise<boolean | string> {
    try {
      await ApiClient.Students.createStudent({ ...student });
      return true;
    } catch (excp) {
      console.dir(excp);
      console.error(`Unable to create student: ${JSON.stringify(excp)}`);
      const message: string = excp.message || "";
      if (message.includes("422")) {
        return "User already exists";
      } else {
        return "Unable to create user";
      }
    }
  }

  async updateStudent(contact: StudentContact): Promise<void> {
    await ApiClient.Students.updateStudentContact({ ...contact });
  }

  public async getContact(): Promise<StudentContact> {
    const studentContact = await ApiClient.Students.getContact();
    return studentContact;
  }

  async getStudentInfo() {
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

  async getProgramYears(): Promise<void> {
    await ApiClient.Students.getProgramYears();
  }
}
