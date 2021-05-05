import { InstitutionLocationInfo } from "../../../database/entities/institution-location.model";

export class GetInstitutionLocationDto {
  id: number;
  data: InstitutionLocationInfo;
  name: string;
}
