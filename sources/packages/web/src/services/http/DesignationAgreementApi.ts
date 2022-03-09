import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  SubmitDesignationAgreementDto,
  GetDesignationAgreementDto,
  GetDesignationAgreementsDto,
  PendingDesignationDto,
  DesignationAgreementStatus,
  UpdateDesignationDto,
} from "@/types/contracts/DesignationAgreementContract";
import { PaginationParams } from "@/types";

/**
 * Http API client for Designation agreements.
 */
export class DesignationAgreementApi extends HttpBaseClient {
  async submitDesignationAgreement(
    designationAgreement: SubmitDesignationAgreementDto,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot("designation-agreement"),
      designationAgreement,
    );
  }

  async getDesignationAgreement(
    designationId: number,
  ): Promise<GetDesignationAgreementDto> {
    return this.getCallTyped<GetDesignationAgreementDto>(
      this.addClientRoot(`designation-agreement/${designationId}`),
    );
  }

  async getDesignationsAgreements(
    institutionId?: number,
  ): Promise<GetDesignationAgreementsDto[]> {
    const url = institutionId
      ? `designation-agreement/institution/${institutionId}`
      : "designation-agreement";
    return this.getCallTyped<GetDesignationAgreementsDto[]>(
      this.addClientRoot(url),
    );
  }

  async getDesignationByStatus(
    designationStatus: DesignationAgreementStatus,
    searchCriteria?: string,
  ): Promise<PendingDesignationDto[]> {
    let url = `designation-agreement/status/${designationStatus}`;
    if (searchCriteria) {
      url = `${url}?${PaginationParams.SearchCriteria}=${searchCriteria}`;
    }
    return this.getCallTyped<PendingDesignationDto[]>(this.addClientRoot(url));
  }

  async updateDesignationAgreement(
    designationId: number,
    designation: UpdateDesignationDto,
  ): Promise<void> {
    await this.patchCall<UpdateDesignationDto>(
      this.addClientRoot(`designation-agreement/${designationId}`),
      designation,
    );
  }
}
