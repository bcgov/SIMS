import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  RestrictionSummaryDTO,
  RestrictionDetailDTO,
  ResolveRestrictionDTO,
  OptionItemDto,
  AssignRestrictionDTO,
} from "@/types";

/**
 * Http API client for Restrictions.
 */
export class RestrictionApi extends HttpBaseClient {
  public async getStudentRestrictions(
    studentId: number,
  ): Promise<RestrictionSummaryDTO[]> {
    const studentRestrictions = await this.getCall(
      `restrictions/student/${studentId}`,
    );
    return studentRestrictions.data as RestrictionSummaryDTO[];
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
  ): Promise<RestrictionDetailDTO> {
    const studentRestriction = await this.getCall(
      `restrictions/student/${studentId}/studentRestriction/${studentRestrictionId}`,
    );
    return studentRestriction.data as RestrictionDetailDTO;
  }

  public async addStudentRestriction(
    studentId: number,
    payload: AssignRestrictionDTO,
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
    payload: ResolveRestrictionDTO,
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

  public async getInstitutionRestrictions(
    institutionId: number,
  ): Promise<RestrictionSummaryDTO[]> {
    const institutionRestrictions = await this.getCall(
      `restrictions/institution/${institutionId}`,
    );
    return institutionRestrictions.data as RestrictionSummaryDTO[];
  }

  public async getInstitutionRestrictionDetail(
    institutionId: number,
    institutionRestrictionId: number,
  ): Promise<RestrictionDetailDTO> {
    const institutionRestriction = await this.getCall(
      `restrictions/institution/${institutionId}/institutionRestriction/${institutionRestrictionId}`,
    );
    return institutionRestriction.data as RestrictionDetailDTO;
  }

  public async addInstitutionRestriction(
    institutionId: number,
    payload: AssignRestrictionDTO,
  ): Promise<void> {
    try {
      await this.apiClient.post(
        `restrictions/institution/${institutionId}`,
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async resolveInstitutionRestriction(
    institutionId: number,
    institutionRestrictionId: number,
    payload: ResolveRestrictionDTO,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `restrictions/institution/${institutionId}/institutionRestriction/${institutionRestrictionId}/resolve`,
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
