import { BadRequestException, Injectable } from "@nestjs/common";
import { LocationWithDesignationStatus } from "../../services/institution-location/institution-location.models";
import { FormService, InstitutionLocationService } from "../../services";
import {
  DesignationStatus,
  InstitutionLocationAPIOutDTO,
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationFormAPIOutDTO,
} from "./models/institution-location.dto";
import { FormNames } from "../../services/form/constants";
import { transformAddressDetailsForAddressBlockForm } from "../utils/address-utils";

/**
 * Controller service for institution location.
 */
@Injectable()
export class InstitutionLocationControllerService {
  constructor(
    private readonly locationService: InstitutionLocationService,
    private readonly formService: FormService,
  ) {}

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
              provinceState: el.locationAddress?.address?.provinceState,
              country: el.locationAddress?.address?.country,
              city: el.locationAddress?.address?.city,
              postalCode: el.locationAddress?.address?.postalCode,
            },
          },
          primaryContact: {
            primaryContactFirstName: el.primaryContact?.firstName,
            primaryContactLastName: el.primaryContact?.lastName,
            primaryContactEmail: el.primaryContact?.email,
            primaryContactPhone: el.primaryContact?.phone,
          },
          institutionCode: el.institutionCode,
        };
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

  /**
   * Get the Institution Location details.
   * @param institutionId
   * @param locationId
   * @returns location details as InstitutionLocationFormAPIOutDTO.
   */
  async getInstitutionLocation(
    institutionId: number,
    locationId: number,
  ): Promise<InstitutionLocationFormAPIOutDTO> {
    // get all institution locations.
    const institutionLocation =
      await this.locationService.getInstitutionLocation(
        institutionId,
        locationId,
      );

    return {
      locationName: institutionLocation.name,
      institutionCode: institutionLocation.institutionCode,
      primaryContactFirstName: institutionLocation.primaryContact.firstName,
      primaryContactLastName: institutionLocation.primaryContact.lastName,
      primaryContactEmail: institutionLocation.primaryContact.email,
      primaryContactPhone: institutionLocation.primaryContact.phone,
      ...transformAddressDetailsForAddressBlockForm(
        institutionLocation.data.address,
      ),
    };
  }
}
