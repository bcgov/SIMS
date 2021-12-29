import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  StudentRestrictionSummary,
  StudentRestrictionDetail,
  UpdateRestrictionDTO,
  OptionItemDto,
  AddStudentRestrictionDTO,
} from "@/types";

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

  public async getRestrictionCategories(): Promise<OptionItemDto[]> {
    const categories = await this.getCall(
      "restrictions/categories/options-list",
    );
    return categories.data as OptionItemDto[];
  }

  public async getRestrictionReasons(
    restrictionCategory: string,
  ): Promise<OptionItemDto[]> {
    const reasons = await this.getCall(
      `restrictions/reasons/options-list/category/${restrictionCategory}`,
    );
    return reasons.data as OptionItemDto[];
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

  public async addStudentRestriction(
    studentId: number,
    payload: AddStudentRestrictionDTO,
  ): Promise<void> {
    try {
      await this.apiClient.post(
        `restrictions/student/${studentId}`,
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
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
