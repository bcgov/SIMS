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
  public async getStudentRestrictions(
    studentId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return this.getCallTyped<RestrictionSummaryAPIOutDTO[]>(
      this.addClientRoot(`restrictions/student/${studentId}`),
    );
  }

  public async getRestrictionCategories(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCallTyped<OptionItemAPIOutDTO[]>(
      this.addClientRoot("restrictions/categories/options-list"),
    );
  }

  public async getRestrictionReasons(
    restrictionCategory: string,
  ): Promise<OptionItemAPIOutDTO[]> {
    return this.getCallTyped<OptionItemAPIOutDTO[]>(
      this.addClientRoot(
        `restrictions/reasons/options-list/category/${restrictionCategory}`,
      ),
    );
  }

  public async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return this.getCallTyped<RestrictionDetailAPIOutDTO>(
      this.addClientRoot(
        `restrictions/student/${studentId}/studentRestriction/${studentRestrictionId}`,
      ),
    );
  }

  public async addStudentRestriction(
    studentId: number,
    payload: AssignRestrictionAPIInDTO,
  ): Promise<void> {
    try {
      await this.postCall(
        this.addClientRoot(`restrictions/student/${studentId}`),
        payload,
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async resolveStudentRestriction(
    studentId: number,
    studentRestrictionId: number,
    payload: ResolveRestrictionAPIInDTO,
  ): Promise<void> {
    try {
      await this.patchCall(
        this.addClientRoot(
          `restrictions/student/${studentId}/studentRestriction/${studentRestrictionId}/resolve`,
        ),
        payload,
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getInstitutionRestrictions(
    institutionId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return this.getCallTyped<RestrictionSummaryAPIOutDTO[]>(
      this.addClientRoot(`restrictions/institution/${institutionId}`),
    );
  }

  public async getInstitutionRestrictionDetail(
    institutionId: number,
    institutionRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return this.getCallTyped<RestrictionDetailAPIOutDTO>(
      this.addClientRoot(
        `restrictions/institution/${institutionId}/institutionRestriction/${institutionRestrictionId}`,
      ),
    );
  }

  public async addInstitutionRestriction(
    institutionId: number,
    payload: AssignRestrictionAPIInDTO,
  ): Promise<void> {
    await this.postCall<AssignRestrictionAPIInDTO>(
      this.addClientRoot(`restrictions/institution/${institutionId}`),
      payload,
    );
  }

  public async resolveInstitutionRestriction(
    institutionId: number,
    institutionRestrictionId: number,
    payload: ResolveRestrictionAPIInDTO,
  ): Promise<void> {
    await this.patchCall<ResolveRestrictionAPIInDTO>(
      this.addClientRoot(
        `restrictions/institution/${institutionId}/institutionRestriction/${institutionRestrictionId}/resolve`,
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
      this.addClientRoot("restrictions"),
    );
  }
}
