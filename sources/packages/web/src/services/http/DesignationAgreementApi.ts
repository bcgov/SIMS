import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  SubmitDesignationAgreementDto,
  GetDesignationAgreementDto,
  GetDesignationAgreementsDto,
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
      `institution/designation-agreement/${designationId}`,
    );
  }

  async getDesignationsAgreements(): Promise<GetDesignationAgreementsDto[]> {
    return this.getCallTyped<GetDesignationAgreementsDto[]>(
      `institution/designation-agreement`,
    );
  }
}
