import ApiClient from "@/services/http/ApiClient";
import { StudentAppealDTO } from "@/types/contracts/student/StudentRequestChange";
import { StudentAppealApiOutDTO } from "./http/dto/StudentAppeal.dto";

/**
 * Client service layer for Student Appeal.
 */
export class StudentAppealService {
  // Shared Instance
  private static instance: StudentAppealService;

  public static get shared(): StudentAppealService {
    return this.instance || (this.instance = new this());
  }

  async submitStudentAppeal(
    applicationId: number,
    studentAppeal: StudentAppealDTO,
  ): Promise<void> {
    await ApiClient.StudentAppealApi.submitStudentAppeal(
      applicationId,
      studentAppeal,
    );
  }

  async getStudentAppealWithRequests(
    appealId: number,
  ): Promise<StudentAppealApiOutDTO> {
    return ApiClient.StudentAppealApi.getStudentAppealWithRequests(appealId);
  }
}
