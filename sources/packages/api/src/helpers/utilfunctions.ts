import { InstitutionLocationsDetailsDto } from "../route-controllers/institution-locations/models/institution-location.dto";
import {
  DesignationAgreementLocation,
  DesignationAgreementStatus,
} from "../database/entities";

export default class Helper {
  /**
   * helper method to map attributes from designation agreement location model to institution location dto.
   * @param designationAgreementLocationData
   * @returns designation agreement locations and their designation statuses.
   */
  static mapDesignationAgreementLocationToInstitutionLocationDTO(
    designationAgreementLocationData: DesignationAgreementLocation[],
  ) {
    return designationAgreementLocationData.map(
      (el: DesignationAgreementLocation) => {
        return {
          id: el.institutionLocation.id,
          name: el.institutionLocation.name,
          designationStatus: this.getDesignationStatus(
            el.designationAgreement.designationStatus,
            el.approved,
            el.designationAgreement.startDate,
            el.designationAgreement.endDate,
          ),
          data: {
            address: {
              addressLine1: el.institutionLocation.data.address?.addressLine1,
              addressLine2: el.institutionLocation.data.address?.addressLine2,
              province: el.institutionLocation.data.address?.province,
              country: el.institutionLocation.data.address?.country,
              city: el.institutionLocation.data.address?.city,
              postalCode: el.institutionLocation.data.address?.postalCode,
            },
          },
          primaryContact: {
            primaryContactFirstName:
              el.institutionLocation.primaryContact?.firstName,
            primaryContactLastName:
              el.institutionLocation.primaryContact?.lastName,
            primaryContactEmail: el.institutionLocation.primaryContact?.email,
            primaryContactPhone:
              el.institutionLocation.primaryContact?.phoneNumber,
          },
          institution: {
            institutionPrimaryContact: {
              primaryContactEmail:
                el.institutionLocation.institution.institutionPrimaryContact
                  .primaryContactEmail,
              primaryContactFirstName:
                el.institutionLocation.institution.institutionPrimaryContact
                  .primaryContactFirstName,
              primaryContactLastName:
                el.institutionLocation.institution.institutionPrimaryContact
                  .primaryContactLastName,
              primaryContactPhone:
                el.institutionLocation.institution.institutionPrimaryContact
                  .primaryContactPhone,
            },
          },
          institutionCode: el.institutionLocation.institutionCode,
        } as InstitutionLocationsDetailsDto;
      },
    );
  }

  /**
   * internal helper function to check if location is designated or not.
   * @param  designationAgreementStatus
   * @param  isApproved
   * @param  startDate
   * @param  endDate
   * @returns designation status.
   */
  private static getDesignationStatus(
    designationAgreementStatus: DesignationAgreementStatus,
    isApproved: boolean,
    startDate: Date,
    endDate: Date,
  ): DesignationAgreementStatus {
    if (
      designationAgreementStatus === DesignationAgreementStatus.Approved &&
      isApproved &&
      this.isDesignationAgreementLocationDateValid(startDate, endDate)
    ) {
      return DesignationAgreementStatus.Designated;
    } else {
      return DesignationAgreementStatus.NotDesignated;
    }
  }

  /**
   * internal helper function to check if current date is between start date and end date.
   * @param  startDate
   * @param  endDate
   * @returns true or false.
   */
  private static isDesignationAgreementLocationDateValid(
    startDate: Date,
    endDate: Date,
  ): boolean {
    const currentDate = new Date();
    if (currentDate >= startDate && currentDate <= endDate) {
      return true;
    } else {
      return false;
    }
  }
}
