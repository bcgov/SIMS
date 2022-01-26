import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsNumber,
  Min,
} from "class-validator";

export class SubmitDesignationAgreementDto {
  @IsNumber()
  @Min(1)
  institutionId: number;
  @IsDefined()
  submittedData: any;
  @IsNumber()
  @Min(1)
  submittedByUserId: number;
  @IsArray()
  @ArrayMinSize(1)
  requestedLocationsIds: number[];
}
