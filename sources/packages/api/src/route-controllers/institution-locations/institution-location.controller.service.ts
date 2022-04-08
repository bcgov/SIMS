import { Injectable } from "@nestjs/common";
import { LocationWithDesignationStatus } from "../../services/institution-location/institution-location.models";
import { InstitutionLocationService } from "../../services";
import {
  DesignationStatus,
  InstitutionLocationAPIOutDTO,
} from "./models/institution-location.dto";

@Injectable()
export class InstitutionLocationControllerService {
  constructor(private readonly locationService: InstitutionLocationService) {}

  /**
   * Retrieve institution locations and
   * their associated designated status'.
   * @param institutionId this value is passed only for client type Institution.
   * @returns designation institution locations with their status.
   */
  async getInstitutionLocations(
    institutionId: number,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    const institutionsWithDesignationStatus =
      await this.locationService.getLocations(institutionId);
    return institutionsWithDesignationStatus.map(
      (el: LocationWithDesignationStatus) => {
        return {
          id: el.id,
          name: el.locationName,
          designationStatus: el.isDesignated
            ? DesignationStatus.Designated
            : DesignationStatus.NotDesignated,
          data: {
            address: {
              addressLine1: el.locationAddress?.address?.addressLine1,
              addressLine2: el.locationAddress?.address?.addressLine2,
              province: el.locationAddress?.address?.province,
              country: el.locationAddress?.address?.country,
              city: el.locationAddress?.address?.city,
              postalCode: el.locationAddress?.address?.postalCode,
            },
          },
          primaryContact: {
            primaryContactFirstName: el.primaryContact?.firstName,
            primaryContactLastName: el.primaryContact?.lastName,
            primaryContactEmail: el.primaryContact?.email,
            primaryContactPhone: el.primaryContact?.phoneNumber,
          },
          institutionCode: el.institutionCode,
        } as InstitutionLocationAPIOutDTO;
      },
    );
  }

  /**
   * Retrieve designation status of institution.
   * @param institutionId
   * @returns designation status of an institution'.
   */
  async getInstitutionDesignationStatus(
    institutionId: number,
  ): Promise<DesignationStatus> {
    const institutionLocationsWithDesignationStatus =
      await this.getInstitutionLocations(institutionId);
    return institutionLocationsWithDesignationStatus.some(
      (item) => item.designationStatus === DesignationStatus.Designated,
    )
      ? DesignationStatus.Designated
      : DesignationStatus.NotDesignated;
  }
}
