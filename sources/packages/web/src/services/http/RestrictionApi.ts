import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  AssignRestrictionAPIInDTO,
  DeleteRestrictionAPIInDTO,
  OptionItemAPIOutDTO,
  ResolveRestrictionAPIInDTO,
  RestrictionDetailAPIOutDTO,
  RestrictionSummaryAPIOutDTO,
  StudentRestrictionAPIOutDTO,
} from "@/services/http/dto";

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

  async getRestrictionReasons(
    restrictionCategory: string,
  ): Promise<OptionItemAPIOutDTO[]> {
    return this.getCall<OptionItemAPIOutDTO[]>(
      this.addClientRoot(`restriction/category/${restrictionCategory}/reasons`),
    );
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

  async getInstitutionRestrictions(
    institutionId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return this.getCall<RestrictionSummaryAPIOutDTO[]>(
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

  async addInstitutionRestriction(
    institutionId: number,
    payload: AssignRestrictionAPIInDTO,
  ): Promise<void> {
    await this.postCall<AssignRestrictionAPIInDTO>(
      this.addClientRoot(`restriction/institution/${institutionId}`),
      payload,
    );
  }

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
}
