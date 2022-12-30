import { Injectable, NotFoundException } from "@nestjs/common";
import { INSTITUTION_TYPE_BC_PRIVATE } from "@sims/sims-db/constant";
import { getISODateOnlyString } from "@sims/utilities";
import { DesignationAgreementService } from "../../services";
import {
  DesignationAgreementAPIOutDTO,
  DesignationAgreementDetailsAPIOutDTO,
} from "./models/designation-agreement.dto";
/**
 * This service controller is a provider which is created to extract the implementation of
 * controller in one place as their business logic is shared between different client types.
 * (e.g. AEST and Institution).
 */
@Injectable()
export class DesignationAgreementControllerService {
  constructor(
    private readonly designationAgreementService: DesignationAgreementService,
  ) {}

  /**
   * Retrieve the designation agreement information and
   * the associated locations approvals.
   * @param designationId id of the designation to be retrieved.
   * @param institutionId this value is passed only for client type Institution.
   * @returns designation agreement information.
   */
  async getDesignationAgreement(
    designationId: number,
    institutionId?: number,
  ): Promise<DesignationAgreementAPIOutDTO> {
    const designation =
      await this.designationAgreementService.getInstitutionDesignationById(
        designationId,
        institutionId,
      );
    if (!designation) {
      throw new NotFoundException("Designation agreement not found.");
    }

    return {
      designationId: designation.id,
      designationStatus: designation.designationStatus,
      submittedData: designation.submittedData,
      institutionName: designation.institution.legalOperatingName,
      institutionType: designation.institution.institutionType.name,
      isBCPrivate:
        designation.institution.institutionType.id ===
        INSTITUTION_TYPE_BC_PRIVATE,
      institutionId: designation.institution.id,
      startDate: designation.startDate,
      endDate: designation.endDate,
      locationsDesignations: designation.designationAgreementLocations.map(
        (agreementLocation) => ({
          locationId: agreementLocation.institutionLocation.id,
          locationName: agreementLocation.institutionLocation.name,
          locationData: agreementLocation.institutionLocation.data,
          requested: agreementLocation.requested,
          approved: agreementLocation.approved,
          designationLocationId: agreementLocation.id,
        }),
      ),
    } as DesignationAgreementAPIOutDTO;
  }

  /**
   * Get the list of all the designations that belongs to
   * the institution.
   * @param institutionId id of the institution that designations belong to.
   * @returns the list of all the designations that
   * belongs to the institution.
   */
  async getDesignationAgreements(
    institutionId: number,
  ): Promise<DesignationAgreementDetailsAPIOutDTO[]> {
    const designations =
      await this.designationAgreementService.getInstitutionDesignationsById(
        institutionId,
      );
    return designations.map(
      (designation) =>
        ({
          designationId: designation.id,
          designationStatus: designation.designationStatus,
          submittedDate: designation.submittedDate,
          startDate: getISODateOnlyString(designation.startDate),
          endDate: getISODateOnlyString(designation.endDate),
        } as DesignationAgreementDetailsAPIOutDTO),
    );
  }
}
