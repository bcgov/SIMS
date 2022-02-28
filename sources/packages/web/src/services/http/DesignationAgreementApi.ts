import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  SubmitDesignationAgreementDto,
  GetDesignationAgreementDto,
  GetDesignationAgreementsDto,
  PendingDesignationDto,
} from "@/types/contracts/DesignationAgreementContract";

/**
 * Http API client for Designation agreements.
 */
export class DesignationAgreementApi extends HttpBaseClient {
  async submitDesignationAgreement(
    designationAgreement: SubmitDesignationAgreementDto,
  ): Promise<void> {
    await this.postCall(
      "institution/designation-agreement",
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

  async getPendingDesignations(): Promise<PendingDesignationDto[]> {
    return this.getCallTyped<PendingDesignationDto[]>(
      this.addClientRoot("designation-agreement/status/pending"),
    );
  }
}
