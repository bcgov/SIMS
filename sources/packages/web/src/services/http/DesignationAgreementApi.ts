import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  SubmitDesignationAgreementAPIInDTO,
  DesignationAgreementAPIOutDTO,
  DesignationAgreementDetailsAPIOutDTO,
  PendingDesignationAgreementDetailsAPIOutDTO,
  DesignationAgreementStatus,
  UpdateDesignationDetailsAPIInDTO,
} from "@/services/http/dto";
import { PaginationParams } from "@/types";

/**
 * Http API client for Designation agreements.
 */
export class DesignationAgreementApi extends HttpBaseClient {
  async submitDesignationAgreement(
    designationAgreement: SubmitDesignationAgreementAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot("designation-agreement"),
      designationAgreement,
    );
  }

  async getDesignationAgreement(
    designationId: number,
  ): Promise<DesignationAgreementAPIOutDTO> {
    return this.getCall<DesignationAgreementAPIOutDTO>(
      this.addClientRoot(`designation-agreement/${designationId}`),
    );
  }

  async getDesignationsAgreements(
    institutionId?: number,
  ): Promise<DesignationAgreementDetailsAPIOutDTO[]> {
    const url = institutionId
      ? `designation-agreement/institution/${institutionId}`
      : "designation-agreement";
    return this.getCall<DesignationAgreementDetailsAPIOutDTO[]>(
      this.addClientRoot(url),
    );
  }

  async getDesignationByStatus(
    designationStatus: DesignationAgreementStatus,
    searchCriteria?: string,
  ): Promise<PendingDesignationAgreementDetailsAPIOutDTO[]> {
    let url = `designation-agreement/status/${designationStatus}`;
    if (searchCriteria) {
      url = `${url}?${PaginationParams.SearchCriteria}=${searchCriteria}`;
    }
    return this.getCall<PendingDesignationAgreementDetailsAPIOutDTO[]>(
      this.addClientRoot(url),
    );
  }

  async updateDesignationAgreement(
    designationId: number,
    designation: UpdateDesignationDetailsAPIInDTO,
  ): Promise<void> {
    await this.patchCall<UpdateDesignationDetailsAPIInDTO>(
      this.addClientRoot(`designation-agreement/${designationId}`),
      designation,
    );
  }
}
