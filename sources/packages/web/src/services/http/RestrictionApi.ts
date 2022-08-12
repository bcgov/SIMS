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
    return this.getCallTyped<RestrictionSummaryDTO[]>(
      this.addClientRoot(`restrictions/student/${studentId}`),
    );
  }

  public async getRestrictionCategories(): Promise<OptionItemDto[]> {
    return this.getCallTyped<OptionItemDto[]>(
      this.addClientRoot("restrictions/categories/options-list"),
    );
  }

  public async getRestrictionReasons(
    restrictionCategory: string,
  ): Promise<OptionItemDto[]> {
    return this.getCallTyped<OptionItemDto[]>(
      this.addClientRoot(
        `restrictions/reasons/options-list/category/${restrictionCategory}`,
      ),
    );
  }

  public async getStudentRestrictionDetail(
    studentId: number,
    studentRestrictionId: number,
  ): Promise<RestrictionDetailDTO> {
    return this.getCallTyped<RestrictionDetailDTO>(
      this.addClientRoot(
        `restrictions/student/${studentId}/studentRestriction/${studentRestrictionId}`,
      ),
    );
  }

  public async addStudentRestriction(
    studentId: number,
    payload: AssignRestrictionDTO,
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
    payload: ResolveRestrictionDTO,
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
  ): Promise<RestrictionSummaryDTO[]> {
    return this.getCallTyped<RestrictionSummaryDTO[]>(
      this.addClientRoot(`restrictions/institution/${institutionId}`),
    );
  }

  public async getInstitutionRestrictionDetail(
    institutionId: number,
    institutionRestrictionId: number,
  ): Promise<RestrictionDetailDTO> {
    return this.getCallTyped<RestrictionDetailDTO>(
      this.addClientRoot(
        `restrictions/institution/${institutionId}/institutionRestriction/${institutionRestrictionId}`,
      ),
    );
  }

  public async addInstitutionRestriction(
    institutionId: number,
    payload: AssignRestrictionDTO,
  ): Promise<void> {
    await this.postCall<AssignRestrictionDTO>(
      this.addClientRoot(`restrictions/institution/${institutionId}`),
      payload,
    );
  }

  public async resolveInstitutionRestriction(
    institutionId: number,
    institutionRestrictionId: number,
    payload: ResolveRestrictionDTO,
  ): Promise<void> {
    await this.patchCall<ResolveRestrictionDTO>(
      this.addClientRoot(
        `restrictions/institution/${institutionId}/institutionRestriction/${institutionRestrictionId}/resolve`,
      ),
      payload,
    );
  }
}
