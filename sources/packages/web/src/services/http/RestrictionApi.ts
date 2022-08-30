import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  AssignRestrictionAPIInDTO,
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
    return this.getCallTyped<RestrictionSummaryAPIOutDTO[]>(
      this.addClientRoot(`restriction/student/${studentId}`),
    );
  }

  async getRestrictionCategories(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCallTyped<OptionItemAPIOutDTO[]>(
      this.addClientRoot("restriction/categories/options-list"),
    );
  }

  async getRestrictionReasons(
    restrictionCategory: string,
  ): Promise<OptionItemAPIOutDTO[]> {
    return this.getCallTyped<OptionItemAPIOutDTO[]>(
      this.addClientRoot(`restriction/category/${restrictionCategory}/reasons`),
    );
  }

  async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return this.getCallTyped<RestrictionDetailAPIOutDTO>(
      this.addClientRoot(
        `restriction/student/${studentId}/studentRestriction/${studentRestrictionId}`,
      ),
    );
  }

  async addStudentRestriction(
    studentId: number,
    payload: AssignRestrictionAPIInDTO,
  ): Promise<void> {
    try {
      await this.postCall(
        this.addClientRoot(`restriction/student/${studentId}`),
        payload,
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  async resolveStudentRestriction(
    studentId: number,
    studentRestrictionId: number,
    payload: ResolveRestrictionAPIInDTO,
  ): Promise<void> {
    try {
      await this.patchCall(
        this.addClientRoot(
          `restriction/student/${studentId}/studentRestriction/${studentRestrictionId}/resolve`,
        ),
        payload,
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  async getInstitutionRestrictions(
    institutionId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return this.getCallTyped<RestrictionSummaryAPIOutDTO[]>(
      this.addClientRoot(`restriction/institution/${institutionId}`),
    );
  }

  async getInstitutionRestrictionDetail(
    institutionId: number,
    institutionRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return this.getCallTyped<RestrictionDetailAPIOutDTO>(
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
    return this.getCallTyped<StudentRestrictionAPIOutDTO[]>(
      this.addClientRoot("restriction"),
    );
  }
}
