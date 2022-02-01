import { ArrayMinSize, IsArray, IsDefined } from "class-validator";
import { DesignationAgreementStatus } from "../../../database/entities";

export class SubmitDesignationAgreementDto {
  @IsDefined()
  submittedData: any;
  @IsArray()
  @ArrayMinSize(1)
  requestedLocationsIds: number[];
}

export interface GetDesignationAgreementDto {
  designationId: number;
  designationStatus: DesignationAgreementStatus;
  locationsDesignations: LocationsDesignationsDto[];
  submittedData: any;
}

export interface LocationsDesignationsDto {
  locationId: number;
  locationName: string;
  locationData: any;
  requested: boolean;
  approved?: boolean;
}
