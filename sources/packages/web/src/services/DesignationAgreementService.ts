import ApiClient from "@/services/http/ApiClient";
import {
  DesignationAgreementDetailsAPIOutDTO,
  SubmitDesignationAgreementAPIInDTO,
  PendingDesignationAgreementDetailsAPIOutDTO,
  DesignationAgreementAPIOutDTO,
  DesignationAgreementStatus,
  UpdateDesignationDetailsAPIInDTO,
} from "@/services/http/dto";

/**
 * Client service layer for Designation agreements.
 */
export class DesignationAgreementService {
  // Shared Instance
  private static instance: DesignationAgreementService;

  static get shared(): DesignationAgreementService {
    return this.instance || (this.instance = new this());
  }

  async submitDesignationAgreement(
    designationAgreement: SubmitDesignationAgreementAPIInDTO,
  ): Promise<void> {
    await ApiClient.DesignationAgreement.submitDesignationAgreement(
      designationAgreement,
    );
  }

  async getDesignationAgreement(
    designationId: number,
  ): Promise<DesignationAgreementAPIOutDTO> {
    return ApiClient.DesignationAgreement.getDesignationAgreement(
      designationId,
    );
  }

  async getDesignationsAgreements(
    institutionId?: number,
  ): Promise<DesignationAgreementDetailsAPIOutDTO[]> {
    return ApiClient.DesignationAgreement.getDesignationsAgreements(
      institutionId,
    );
  }

  async getDesignationByStatus(
    designationStatus: DesignationAgreementStatus,
    searchCriteria?: string,
  ): Promise<PendingDesignationAgreementDetailsAPIOutDTO[]> {
    return ApiClient.DesignationAgreement.getDesignationByStatus(
      designationStatus,
      searchCriteria,
    );
  }

  async updateDesignationAgreement(
    designationId: number,
    designation: UpdateDesignationDetailsAPIInDTO,
  ): Promise<void> {
    /**Filtering the locations which are either approved or denied(already approved location) only.
     * locationsDesignations will have value only when approval is done.
     */
    designation.locationsDesignations =
      designation.locationsDesignations?.filter(
        (location) =>
          location.existingDesignationLocation || location.approved === true,
      );
    await ApiClient.DesignationAgreement.updateDesignationAgreement(
      designationId,
      designation,
    );
  }
}
