import { InstitutionLocationInfo } from "../../../database/entities/institution-location.model";

export class GetInstitutionLocationDto {
  id: number;
  data: InstitutionLocationInfo;
  name: string;
}

export interface InstitutionLocationTypeDto {
  address1: string;
  address2?: string;
  city: string;
  country: string;
  locationName: string;
  postalZipCode: string;
  provinceState: string;
}
