import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { MSFAANumberAPIOutDTO } from "@/services/http/dto";

/**
 * Http API client for MSFAA number activity.
 */
export class MSFAANumberApi extends HttpBaseClient {
  /**
   * Gets the full MSFAA activity for a student.
   * @param studentId student id to retrieve MSFAA records.
   * @returns list of MSFAA activity records for the student.
   */
  async getStudentMSFAAActivity(
    studentId: number,
  ): Promise<MSFAANumberAPIOutDTO[]> {
    return this.getCall<MSFAANumberAPIOutDTO[]>(
      this.addClientRoot(`msfaa-number/student/${studentId}`),
    );
  }
}
