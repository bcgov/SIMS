import { Injectable, NotFoundException } from "@nestjs/common";
import { DesignationAgreementService } from "../../services";
import { getISODateOnlyString } from "../../utilities";
import {
  GetDesignationAgreementDto,
  GetDesignationAgreementsDto,
} from "./models/designation-agreement.model";
/**
 * This service controller is a provider which is created to extract the implementation of
 * controller in one place as their business logic is shared between different client types.
 * (e.g. AEST and Institution).
 */
@Injectable()
export class DesignationAgreementServiceController {
  constructor(
    private readonly designationAgreementService: DesignationAgreementService,
  ) {}

  /**
   * Retrieve the designation agreement information and
   * the associated locations approvals.
   * @param designationId
   * @param institutionId this value is passed only for client type Institution.
   * @returns designation agreement information.
   */
  async getDesignationAgreement(
    designationId: number,
    institutionId?: number,
  ): Promise<GetDesignationAgreementDto> {
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
      locationsDesignations: designation.designationAgreementLocations.map(
        (agreementLocation) => ({
          locationId: agreementLocation.institutionLocation.id,
          locationName: agreementLocation.institutionLocation.name,
          locationData: agreementLocation.institutionLocation.data,
          requested: agreementLocation.requested,
          approved: agreementLocation.approved,
        }),
      ),
    } as GetDesignationAgreementDto;
  }

  /**
   * Get the list of all the designations that belongs to
   * the institution.
   * @param institutionId
   * @returns the list of all the designations that
   * belongs to the institution.
   */
  async getDesignationAgreements(
    institutionId: number,
  ): Promise<GetDesignationAgreementsDto[]> {
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
        } as GetDesignationAgreementsDto),
    );
  }
}
