import ApiClient from "@/services/http/ApiClient";
import {
  GetDesignationAgreementDto,
  GetDesignationAgreementsDto,
  SubmitDesignationAgreementDto,
} from "@/types/contracts/DesignationAgreementContract";

/**
 * Client service layer for Designation agreements.
 */
export class DesignationAgreementService {
  // Shared Instance
  private static instance: DesignationAgreementService;

  public static get shared(): DesignationAgreementService {
    return this.instance || (this.instance = new this());
  }

  public async submitDesignationAgreement(
    designationAgreement: SubmitDesignationAgreementDto,
  ): Promise<void> {
    await ApiClient.DesignationAgreement.submitDesignationAgreement(
      designationAgreement,
    );
  }

  public async getDesignationAgreement(
    designationId: number,
  ): Promise<GetDesignationAgreementDto> {
    return ApiClient.DesignationAgreement.getDesignationAgreement(
      designationId,
    );
  }

  public async getDesignationsAgreements(): Promise<
    GetDesignationAgreementsDto[]
  > {
    return ApiClient.DesignationAgreement.getDesignationsAgreements();
  }
}
