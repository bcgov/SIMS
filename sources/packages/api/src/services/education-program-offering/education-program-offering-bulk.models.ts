import {
  ArrayMinSize,
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import {
  OfferingIntensity,
  OfferingTypes,
  ProgramIntensity,
} from "../../database/entities";

export class StudyBreak {
  @IsDate()
  breakStartDate: Date;
  @IsDate()
  breakEndDate: Date;
}

export class ProgramDeliveryTypes {
  @IsBoolean()
  deliveredOnSite: boolean;
  @IsBoolean()
  deliveredOnline: boolean;
}

export class SaveOfferingModel {
  @IsNotEmpty()
  offeringName: string;
  @Min(1)
  @Max(9)
  yearOfStudy: number;
  @IsBoolean()
  showYearOfStudy: boolean;
  @IsEnum(OfferingIntensity)
  offeringIntensity: OfferingIntensity;
  @IsIn(["onsite", "online", "blended"])
  offeringDelivered: string;
  @IsIn(["yes", "no"])
  hasOfferingWILComponent: string;
  @IsDateString()
  studyStartDate: string;
  @IsDateString()
  studyEndDate: Date;
  @IsBoolean()
  lacksStudyBreaks: boolean;
  @ValidateIf((offering) => !offering.lacksStudyBreaks)
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  // TODO: create custom validators for overlaps and all.
  studyBreaks: StudyBreak[];
  @Min(0)
  actualTuitionCosts: number;
  @Min(0)
  programRelatedCosts: number;
  @Min(0)
  mandatoryFees: number;
  @Min(0)
  exceptionalExpenses: number;
  @IsEnum(ProgramIntensity)
  programIntensity: string;
  @ValidateNested({ each: true })
  programDeliveryTypes: ProgramDeliveryTypes;
  @IsIn(["yes", "no"])
  hasWILComponent: string;
  @IsIn([OfferingTypes.Private, OfferingTypes.Public])
  offeringType: OfferingTypes;
  @IsPositive({ message: "Related program was not found." })
  programId: number;
  @IsPositive({ message: "Related institution location was not found." })
  locationId: number;
  @IsBoolean()
  offeringDeclaration: boolean;
  @IsOptional()
  @Min(20)
  @Max(59)
  courseLoad?: number;
}
