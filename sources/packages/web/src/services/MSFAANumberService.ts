import ApiClient from "@/services/http/ApiClient";
import { MSFAANumberAPIOutDTO } from "@/services/http/dto";

/**
 * Client service layer for MSFAA number activity.
 */
export class MSFAANumberService {
  // Shared Instance
  private static instance: MSFAANumberService;

  static get shared(): MSFAANumberService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Gets the full MSFAA activity for a student.
   * @param studentId student id to retrieve MSFAA records.
   * @returns list of MSFAA activity records for the student.
   */
  async getStudentMSFAAActivity(
    studentId: number,
  ): Promise<MSFAANumberAPIOutDTO[]> {
    return ApiClient.MSFAANumberApi.getStudentMSFAAActivity(studentId);
  }
}
