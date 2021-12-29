import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  StudentRestrictionSummary,
  StudentRestrictionDetail,
  UpdateRestrictionDTO,
} from "@/types/contracts/RestrictionContract";

/**
 * Http API client for Restrictions.
 */
export class RestrictionApi extends HttpBaseClient {
  public async getStudentRestrictions(
    studentId: number,
  ): Promise<StudentRestrictionSummary[]> {
    const studentNotes = await this.getCall(
      `restrictions/student/${studentId}`,
    );
    return studentNotes.data as StudentRestrictionSummary[];
  }

  public async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
  ): Promise<StudentRestrictionDetail> {
    const studentNotes = await this.getCall(
      `restrictions/student/${studentId}/studentRestriction/${studentRestrictionId}`,
    );
    return studentNotes.data as StudentRestrictionDetail;
  }

  public async resolveStudentRestriction(
    studentId: number,
    studentRestrictionId: number,
    payload: UpdateRestrictionDTO,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `restrictions/student/${studentId}/studentRestriction/${studentRestrictionId}/resolve`,
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
