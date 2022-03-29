import {
  InstitutionLocationInfo,
  PrimaryContact,
} from "../../database/entities";

export interface LocationWithDesignationStatus {
  id: number;
  locationName: string;
  isDesignated: boolean;
  locationAddress?: InstitutionLocationInfo;
  institutionCode?: string;
  primaryContact?: PrimaryContact;
}
