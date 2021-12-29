import ApiClient from "@/services/http/ApiClient";
import {
  StudentRestrictionSummary,
  StudentRestrictionDetail,
  UpdateRestrictionDTO,
} from "@/types/contracts/RestrictionContract";

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

  public async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
  ): Promise<StudentRestrictionDetail> {
    return ApiClient.RestrictionApi.getStudentRestrictionDetail(
      studentId,
      studentRestrictionId,
    );
  }

  public async resolveStudentRestriction(
    studentId: number,
    studentRestrictionId: number,
    payload: UpdateRestrictionDTO,
  ): Promise<void> {
    return ApiClient.RestrictionApi.resolveStudentRestriction(
      studentId,
      studentRestrictionId,
      payload,
    );
  }
}
