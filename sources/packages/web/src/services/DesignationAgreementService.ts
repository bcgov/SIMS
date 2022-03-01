import ApiClient from "@/services/http/ApiClient";
import {
  GetDesignationAgreementsDto,
  SubmitDesignationAgreementDto,
  PendingDesignationDto,
  GetDesignationAgreementDto,
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

  public async getDesignationsAgreements(
    institutionId?: number,
  ): Promise<GetDesignationAgreementsDto[]> {
    return ApiClient.DesignationAgreement.getDesignationsAgreements(
      institutionId,
    );
  }

  public async getPendingDesignations(): Promise<PendingDesignationDto[]> {
    return ApiClient.DesignationAgreement.getPendingDesignations();
  }
}
