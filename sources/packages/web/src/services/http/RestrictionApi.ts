import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  AssignInstitutionRestrictionAPIInDTO,
  AssignRestrictionAPIInDTO,
  DeleteRestrictionAPIInDTO,
  InstitutionActiveRestrictionsAPIOutDTO,
  InstitutionRestrictionsAPIOutDTO,
  InstitutionRestrictionSummaryAPIOutDTO,
  OptionItemAPIOutDTO,
  ResolveRestrictionAPIInDTO,
  RestrictionAPIOutDTO,
  RestrictionDetailAPIOutDTO,
  RestrictionSummaryAPIOutDTO,
  StudentRestrictionAPIOutDTO,
} from "@/services/http/dto";
import { RestrictionType } from "@/types/contracts/RestrictionContract";

/**
 * Http API client for Restrictions.
 */
export class RestrictionApi extends HttpBaseClient {
  async getStudentRestrictions(
    studentId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return this.getCall<RestrictionSummaryAPIOutDTO[]>(
      this.addClientRoot(`restriction/student/${studentId}`),
    );
  }

  async getRestrictionCategories(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCall<OptionItemAPIOutDTO[]>(
      this.addClientRoot("restriction/categories/options-list"),
    );
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
    restrictionCategory?: string,
  ): Promise<RestrictionAPIOutDTO[]> {
    let url = `restriction/reasons?type=${restrictionType}`;
    if (restrictionCategory) {
      url += `&category=${restrictionCategory}`;
    }
    return this.getCall<RestrictionAPIOutDTO[]>(this.addClientRoot(url));
  }

  async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return this.getCall<RestrictionDetailAPIOutDTO>(
      this.addClientRoot(
        `restriction/student/${studentId}/student-restriction/${studentRestrictionId}`,
      ),
    );
  }

  async addStudentRestriction(
    studentId: number,
    payload: AssignRestrictionAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot(`restriction/student/${studentId}`),
      payload,
    );
  }

  async resolveStudentRestriction(
    studentId: number,
    studentRestrictionId: number,
    payload: ResolveRestrictionAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(
        `restriction/student/${studentId}/studentRestriction/${studentRestrictionId}/resolve`,
      ),
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
    await this.patchCall(
      this.addClientRoot(
        `restriction/student/${studentId}/student-restriction/${studentRestrictionId}/delete`,
      ),
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
    return this.getCall(
      this.addClientRoot(`restriction/institution/${institutionId}`),
    );
  }

  async getInstitutionRestrictionDetail(
    institutionId: number,
    institutionRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return this.getCall<RestrictionDetailAPIOutDTO>(
      this.addClientRoot(
        `restriction/institution/${institutionId}/institutionRestriction/${institutionRestrictionId}`,
      ),
    );
  }

  /**
   * Add a new restriction to an Institution.
   * @param institutionId ID of the institution to add a restriction.
   * @param payload restriction details.
   */
  async addInstitutionRestriction(
    institutionId: number,
    payload: AssignInstitutionRestrictionAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot(`restriction/institution/${institutionId}`),
      payload,
    );
  }

  /**
   * Resolve an institution restriction.
   * @param institutionId institution id.
   * @param institutionRestrictionId institution restriction id.
   * @param payload payload to resolve the restriction.
   */
  async resolveInstitutionRestriction(
    institutionId: number,
    institutionRestrictionId: number,
    payload: ResolveRestrictionAPIInDTO,
  ): Promise<void> {
    await this.patchCall<ResolveRestrictionAPIInDTO>(
      this.addClientRoot(
        `restriction/institution/${institutionId}/institutionRestriction/${institutionRestrictionId}/resolve`,
      ),
      payload,
    );
  }

  /**
   * API client to call the student restriction rest API.
   * @returns student restriction(wrapped by promise).
   */
  async getStudentRestriction(): Promise<StudentRestrictionAPIOutDTO[]> {
    return this.getCall<StudentRestrictionAPIOutDTO[]>(
      this.addClientRoot("restriction"),
    );
  }

  /**
   * Get institution restrictions effective for the given program and institution location.
   * @param locationId Institution location.
   * @param programId Institution program.
   * @returns Institution restrictions.
   */
  async getLocationProgramInstitutionRestrictions(
    locationId: number,
    programId: number,
  ): Promise<InstitutionRestrictionsAPIOutDTO> {
    return this.getCall(
      this.addClientRoot(
        `restriction/institution/location/${locationId}/program/${programId}`,
      ),
    );
  }

  /**
   * Get active institution restrictions.
   * @param options options.
   * - `institutionId` institution id.
   * @returns active institution restrictions.
   */
  async getActiveInstitutionRestrictions(options?: {
    institutionId?: number;
  }): Promise<InstitutionActiveRestrictionsAPIOutDTO> {
    const url = options?.institutionId
      ? `restriction/institution/${options.institutionId}/active`
      : `restriction/active`;
    return this.getCall(this.addClientRoot(url));
  }
}
