import { Injectable } from "@nestjs/common";
import { InstitutionLocationService } from "../../services";
import {
  DesignationLocationAgreementStatus,
  InstitutionLocationsDetailsDto,
} from "./models/institution-location.dto";

@Injectable()
export class InstitutionLocationsControllerService {
  constructor(private readonly locationService: InstitutionLocationService) {}

  /**
   * Retrieve institution locations and
   * their associated designated status'.
   * @param institutionId this value is passed only for client type Institution.
   * @returns designation institution locations with their status'.
   */
  async getInstitutionLocationsWithDesignationStatus(
    institutionId: number,
  ): Promise<InstitutionLocationsDetailsDto[]> {
    const institutionsWithDesignationStatus =
      await this.locationService.getInstitutionLocationsWithDesignationStatus(
        institutionId,
      );
    return institutionsWithDesignationStatus.map((el: any) => {
      return {
        id: el.location_id,
        name: el.location_name,
        designationStatus: el.isDesignated
          ? DesignationLocationAgreementStatus.Designated
          : DesignationLocationAgreementStatus.NotDesignated,
        data: {
          address: {
            addressLine1: el.location_info.address?.addressLine1,
            addressLine2: el.location_info.address?.addressLine2,
            province: el.location_info.address?.province,
            country: el.location_info.address?.country,
            city: el.location_info.address?.city,
            postalCode: el.location_info.address?.postalCode,
          },
        },
        primaryContact: {
          primaryContactFirstName: el.location_primary_contact?.firstName,
          primaryContactLastName: el.location_primary_contact?.lastName,
          primaryContactEmail: el.location_primary_contact?.email,
          primaryContactPhone: el.location_primary_contact?.phoneNumber,
        },
        institutionCode: el.location_institution_code,
      } as InstitutionLocationsDetailsDto;
    });
  }

  /**
   * Retrieve designation status of institution.
   * @param institutionId
   * @returns designation status of an institution'.
   */
  async getInstitutionDesignationStatus(
    institutionId: number,
  ): Promise<DesignationLocationAgreementStatus> {
    const institutionLocationsWithDesignationStatus =
      await this.getInstitutionLocationsWithDesignationStatus(institutionId);
    return institutionLocationsWithDesignationStatus.filter(
      (item) =>
        item.designationStatus ===
        DesignationLocationAgreementStatus.Designated,
    ).length > 0
      ? DesignationLocationAgreementStatus.Designated
      : DesignationLocationAgreementStatus.NotDesignated;
  }
}
