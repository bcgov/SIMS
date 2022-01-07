import ApiClient from "@/services/http/ApiClient";
import {
  RestrictionSummaryDTO,
  RestrictionDetailDTO,
  ResolveRestrictionDTO,
  OptionItemDto,
  AssignRestrictionDTO,
} from "@/types";

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
  ): Promise<RestrictionSummaryDTO[]> {
    return ApiClient.RestrictionApi.getStudentRestrictions(studentId);
  }

  public async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
  ): Promise<RestrictionDetailDTO> {
    return ApiClient.RestrictionApi.getStudentRestrictionDetail(
      studentId,
      studentRestrictionId,
    );
  }

  public async getRestrictionCategories(): Promise<OptionItemDto[]> {
    return ApiClient.RestrictionApi.getRestrictionCategories();
  }

  public async getRestrictionReasons(
    restrictionCategory: string,
  ): Promise<OptionItemDto[]> {
    return ApiClient.RestrictionApi.getRestrictionReasons(restrictionCategory);
  }

  public async addStudentRestriction(
    studentId: number,
    payload: AssignRestrictionDTO,
  ): Promise<void> {
    return ApiClient.RestrictionApi.addStudentRestriction(studentId, payload);
  }

  public async resolveStudentRestriction(
    studentId: number,
    studentRestrictionId: number,
    payload: ResolveRestrictionDTO,
  ): Promise<void> {
    return ApiClient.RestrictionApi.resolveStudentRestriction(
      studentId,
      studentRestrictionId,
      payload,
    );
  }

  public async getInstitutionRestrictions(
    institutionId: number,
  ): Promise<RestrictionSummaryDTO[]> {
    return ApiClient.RestrictionApi.getInstitutionRestrictions(institutionId);
  }

  public async getInstitutionRestrictionDetail(
    institutionId: number,
    institutionRestrictionId: number,
  ): Promise<RestrictionDetailDTO> {
    return ApiClient.RestrictionApi.getInstitutionRestrictionDetail(
      institutionId,
      institutionRestrictionId,
    );
  }

  public async addInstitutionRestriction(
    institutionId: number,
    payload: AssignRestrictionDTO,
  ): Promise<void> {
    return ApiClient.RestrictionApi.addInstitutionRestriction(
      institutionId,
      payload,
    );
  }

  public async resolveInstitutionRestriction(
    institutionId: number,
    institutionRestrictionId: number,
    payload: ResolveRestrictionDTO,
  ): Promise<void> {
    return ApiClient.RestrictionApi.resolveInstitutionRestriction(
      institutionId,
      institutionRestrictionId,
      payload,
    );
  }
}
