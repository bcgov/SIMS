import { ArrayMinSize, IsArray, IsDefined } from "class-validator";

export class SubmitDesignationAgreementDto {
  @IsDefined()
  submittedData: any;
  @IsArray()
  @ArrayMinSize(1)
  requestedLocationsIds: number[];
}
