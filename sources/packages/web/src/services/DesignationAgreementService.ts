import ApiClient from "@/services/http/ApiClient";
import {
  GetDesignationAgreementsDto,
  SubmitDesignationAgreementDto,
  PendingDesignationDto,
  GetDesignationAgreementDto,
  DesignationAgreementStatus,
  UpdateDesignationDto,
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

  public async getDesignationByStatus(
    designationStatus: DesignationAgreementStatus,
    searchCriteria?: string,
  ): Promise<PendingDesignationDto[]> {
    return ApiClient.DesignationAgreement.getDesignationByStatus(
      designationStatus,
      searchCriteria,
    );
  }

  public async updateDesignationAgreement(
    designationId: number,
    designation: UpdateDesignationDto,
  ): Promise<void> {
    designation.locationsDesignations = designation.locationsDesignations?.filter(
      location =>
        location.existingDesignationLocation || location.approved === true,
    );
    await ApiClient.DesignationAgreement.updateDesignationAgreement(
      designationId,
      designation,
    );
  }
}
