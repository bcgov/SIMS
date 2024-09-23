import ApiClient from "@/services/http/ApiClient";
import {
  AssignRestrictionAPIInDTO,
  OptionItemAPIOutDTO,
  ResolveRestrictionAPIInDTO,
  RestrictionDetailAPIOutDTO,
  RestrictionSummaryAPIOutDTO,
  StudentRestrictionAPIOutDTO,
} from "@/services/http/dto";

/**
 * Client service layer for Restrictions.
 */
export class RestrictionService {
  // Shared Instance
  private static instance: RestrictionService;

  static get shared(): RestrictionService {
    return this.instance || (this.instance = new this());
  }

  async getStudentRestrictions(
    studentId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return ApiClient.RestrictionApi.getStudentRestrictions(studentId);
  }

  async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return ApiClient.RestrictionApi.getStudentRestrictionDetail(
      studentId,
      studentRestrictionId,
    );
  }

  async getRestrictionCategories(): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.RestrictionApi.getRestrictionCategories();
  }

  async getRestrictionReasons(
    restrictionCategory: string,
  ): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.RestrictionApi.getRestrictionReasons(restrictionCategory);
  }

  async addStudentRestriction(
    studentId: number,
    payload: AssignRestrictionAPIInDTO,
  ): Promise<void> {
    await ApiClient.RestrictionApi.addStudentRestriction(studentId, payload);
  }

  async resolveStudentRestriction(
    studentId: number,
    studentRestrictionId: number,
    payload: ResolveRestrictionAPIInDTO,
  ): Promise<void> {
    await ApiClient.RestrictionApi.resolveStudentRestriction(
      studentId,
      studentRestrictionId,
      payload,
    );
  }

  async getInstitutionRestrictions(
    institutionId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return ApiClient.RestrictionApi.getInstitutionRestrictions(institutionId);
  }

  async getInstitutionRestrictionDetail(
    institutionId: number,
    institutionRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return ApiClient.RestrictionApi.getInstitutionRestrictionDetail(
      institutionId,
      institutionRestrictionId,
    );
  }

  async addInstitutionRestriction(
    institutionId: number,
    payload: AssignRestrictionAPIInDTO,
  ): Promise<void> {
    await ApiClient.RestrictionApi.addInstitutionRestriction(
      institutionId,
      payload,
    );
  }

  async resolveInstitutionRestriction(
    institutionId: number,
    institutionRestrictionId: number,
    payload: ResolveRestrictionAPIInDTO,
  ): Promise<void> {
    await ApiClient.RestrictionApi.resolveInstitutionRestriction(
      institutionId,
      institutionRestrictionId,
      payload,
    );
  }

  /**
   * API client to call the student restriction rest API.
   * @returns student restriction(wrapped by promise).
   */
  async getStudentRestriction(): Promise<StudentRestrictionAPIOutDTO[]> {
    return ApiClient.RestrictionApi.getStudentRestriction();
  }

  /**
   * Get history of bypassed restrictions for an application that is not a draft.
   * @param applicationId, application id.
   * @param studentId, student id.
   * @returns summary of the bypassed restriction history for a student application.
   */
  async getBypassedRestrictionHistory(
    applicationId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return ApiClient.RestrictionApi.getStudentRestrictions(applicationId);
  }
}
