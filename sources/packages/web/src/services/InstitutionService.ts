import { Institute } from "../types/contracts/InstituteContract";
import {
  CreateInstitutionDto,
  EducationProgram,
  InstitutionProfileState,
} from "../types";
import ApiClient from "./http/ApiClient";

export class InstitutionService {
  // Share Instance
  private static instance: InstitutionService;

  public static get shared(): InstitutionService {
    return this.instance || (this.instance = new this());
  }

  public async getInstitutes(): Promise<Institute[]> {
    // TODO: Sending dummy list for now later replace with API call
    const institutes: Institute[] = [
      {
        name: "Sprott Shaw College",
        code: "ssc",
      },
    ];
    return institutes;
  }

  public async getProgramsFor(
    institute?: Institute,
  ): Promise<EducationProgram[]> {
    if (institute?.code === "ssc") {
      const programs: EducationProgram[] = [
        {
          name: "Nursing Program",
          code: "np",
        },
      ];
      return programs;
    }
    return [];
  }

  public async createInstitution(institutionProfile: InstitutionProfileState) {
    const institutionDto: CreateInstitutionDto = {
      operatingName: institutionProfile.operatingName,
      primaryPhone: institutionProfile.primaryPhoneNumber,
      primaryEmail: institutionProfile.primaryEmail,
      website: institutionProfile.institutionWebsite,
      regulatingBody: institutionProfile.regulatingBody,
      establishedDate: institutionProfile.estabilishdDate,
      // Primary Contact
      primaryContactFirstName: institutionProfile.primaryContact.firstName,
      primaryContactLastName: institutionProfile.primaryContact.lastName,
      primaryContactEmail: institutionProfile.primaryContact.email,
      primaryContactPhone: institutionProfile.primaryContact.phoneNumber,
      // Legal Authority Contact
      legalAuthorityFirstName: institutionProfile.legalContact.firstName,
      legalAuthorityLastName: institutionProfile.legalContact.lastName,
      legalAuthorityEmail: institutionProfile.legalContact.email,
      legalAuthorityPhone: institutionProfile.legalContact.phoneNumber,
      // Primary address
      addressLine1: institutionProfile.primaryAddress.address1,
      addressLine2: institutionProfile.primaryAddress.address2,
      city: institutionProfile.primaryAddress.city,
      provinceState: institutionProfile.primaryAddress.provinceState,
      country: institutionProfile.primaryAddress.coutry,
      postalCode: institutionProfile.primaryAddress.postalCode,
    };
    await ApiClient.Institution.createInstitution(institutionDto);
  }
}
