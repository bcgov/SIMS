import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { SubmitDesignationAgreementDto } from "@/types/contracts/DesignationAgreementContract";

/**
 * Http API client for Designation agreements.
 */
export class DesignationAgreementApi extends HttpBaseClient {
  public async submitDesignationAgreement(
    designationAgreement: SubmitDesignationAgreementDto,
  ): Promise<void> {
    try {
      await this.apiClient.post(
        "institution/designation-agreement",
        designationAgreement,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
