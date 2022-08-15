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

  public static get shared(): RestrictionService {
    return this.instance || (this.instance = new this());
  }

  public async getStudentRestrictions(
    studentId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return ApiClient.RestrictionApi.getStudentRestrictions(studentId);
  }

  public async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return ApiClient.RestrictionApi.getStudentRestrictionDetail(
      studentId,
      studentRestrictionId,
    );
  }

  public async getRestrictionCategories(): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.RestrictionApi.getRestrictionCategories();
  }

  public async getRestrictionReasons(
    restrictionCategory: string,
  ): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.RestrictionApi.getRestrictionReasons(restrictionCategory);
  }

  public async addStudentRestriction(
    studentId: number,
    payload: AssignRestrictionAPIInDTO,
  ): Promise<void> {
    await ApiClient.RestrictionApi.addStudentRestriction(studentId, payload);
  }

  public async resolveStudentRestriction(
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

  public async getInstitutionRestrictions(
    institutionId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return ApiClient.RestrictionApi.getInstitutionRestrictions(institutionId);
  }

  public async getInstitutionRestrictionDetail(
    institutionId: number,
    institutionRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return ApiClient.RestrictionApi.getInstitutionRestrictionDetail(
      institutionId,
      institutionRestrictionId,
    );
  }

  public async addInstitutionRestriction(
    institutionId: number,
    payload: AssignRestrictionAPIInDTO,
  ): Promise<void> {
    await ApiClient.RestrictionApi.addInstitutionRestriction(
      institutionId,
      payload,
    );
  }

  public async resolveInstitutionRestriction(
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
}
