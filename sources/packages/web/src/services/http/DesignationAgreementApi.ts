import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  SubmitDesignationAgreementDto,
  GetDesignationAgreementDto,
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
    try {
      return await this.getCall(
        `institution/designation-agreement/${designationId}`,
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
