import ApiClient from "@/services/http/ApiClient";
import {
  DesignationAgreementDetailsAPIOutDTO,
  SubmitDesignationAgreementAPIInDTO,
  PendingDesignationAgreementDetailsAPIOutDTO,
  DesignationAgreementAPIOutDTO,
  DesignationAgreementStatus,
  UpdateDesignationDetailsAPIInDTO,
} from "@/services/http/dto";
import { UpdateDesignationDetailsModel } from "@/components/partial-view/DesignationAgreement/DesignationAgreementForm.models";
import { useFormioUtils } from "@/composables";

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
    designation: UpdateDesignationDetailsModel,
  ): Promise<void> {
    // Filtering the locations which are either approved or denied(already approved location) only.
    // locationsDesignations will have value only when approval is done.
    designation.locationsDesignations =
      designation.locationsDesignations?.filter(
        (location) =>
          location.existingDesignationLocation || location.approved === true,
      );
    const { excludeExtraneousValues } = useFormioUtils();
    const typedPayload = excludeExtraneousValues(
      UpdateDesignationDetailsAPIInDTO,
      designation,
    );
    await ApiClient.DesignationAgreement.updateDesignationAgreement(
      designationId,
      typedPayload,
    );
  }
}
