import ApiClient from "@/services/http/ApiClient";
import {
  AssignInstitutionRestrictionAPIInDTO,
  AssignRestrictionAPIInDTO,
  DeleteRestrictionAPIInDTO,
  InstitutionRestrictionSummaryAPIOutDTO,
  OptionItemAPIOutDTO,
  ResolveRestrictionAPIInDTO,
  RestrictionDetailAPIOutDTO,
  RestrictionSummaryAPIOutDTO,
  StudentRestrictionAPIOutDTO,
} from "@/services/http/dto";
import { RestrictionType } from "@/types/contracts/RestrictionContract";

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

  /**
   * Returns restriction reasons(descriptions) for a
   * given restriction type and category.
   * @param restrictionType Type of the restriction.
   * @param restrictionCategory Category of the restriction.
   * @returns Restriction reasons.
   */
  async getRestrictionReasons(
    restrictionType: RestrictionType.Provincial | RestrictionType.Institution,
    restrictionCategory: string,
  ): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.RestrictionApi.getRestrictionReasons(
      restrictionType,
      restrictionCategory,
    );
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

  /**
   * Soft deletes a provincial restriction from Student.
   * @param studentId ID of the student to get a restriction.
   * @param studentRestrictionId ID of the student restriction to be deleted.
   * @param payload delete restriction details.
   */
  async deleteStudentProvincialRestriction(
    studentId: number,
    studentRestrictionId: number,
    payload: DeleteRestrictionAPIInDTO,
  ): Promise<void> {
    await ApiClient.RestrictionApi.deleteStudentProvincialRestriction(
      studentId,
      studentRestrictionId,
      payload,
    );
  }

  /**
   * Get restrictions for an institution.
   * @param institutionId ID of the institution to retrieve its restrictions.
   * @returns Institution restrictions.
   */
  async getInstitutionRestrictions(
    institutionId: number,
  ): Promise<InstitutionRestrictionSummaryAPIOutDTO[]> {
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

  /**
   * Add a new restriction to an Institution.
   * @param institutionId ID of the institution to add a restriction.
   * @param payload restriction details.
   * @returns Identifier of the created institution restriction.
   */
  async addInstitutionRestriction(
    institutionId: number,
    payload: AssignInstitutionRestrictionAPIInDTO,
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
}
