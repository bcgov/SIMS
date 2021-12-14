import ApiClient from "@/services/http/ApiClient";
import { StudentRestrictionSummary } from "@/types/contracts/RestrictionContract";

/**
 * Client service layer for Restrictions.
 */
export class RestrictionService {
  // Shared Instance
  private static instance: RestrictionService;

  public static get shared(): RestrictionService {
    return this.instance || (this.instance = new this());
  }

  public async getStudentRestrictions(
    studentId: number,
  ): Promise<StudentRestrictionSummary[]> {
    return ApiClient.RestrictionApi.getStudentRestrictions(studentId);
  }
}
