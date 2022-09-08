import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Matches,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { OfferingIntensity } from "../../database/entities";
import {
  currencyNumberOptions,
  OfferingDeliveryOptions,
} from "./education-program-offering-validation.models";

const DATE_FORMAT = "YYYY-MM-DD";

export const STUDY_BREAK_INDEX_PLACE_HOLDER = "{index}";

export const CSVHeaders = {
  LocationCode: "Institution Location Code",
  SABCProgramCode: "SABC Program Code",
  OfferingName: "Name",
  YearOfStudy: "Year of Study",
  ShowYearOfStudy: "Show Year of Study",
  OfferingIntensity: "Offering Intensity",
  CourseLoad: "Course Load",
  DeliveredType: "Delivered Type",
  WILComponent: "WIL Component",
  WILComponentType: "WIL Component Type",
  StudyStartDate: "Start Date",
  StudyEndDate: "End Date",
  HasStudyBreaks: "Has Study Breaks",
  ActualTuitionCosts: "Actual Tuition",
  ProgramRelatedCosts: "Program Related Costs",
  MandatoryFees: "Mandatory Fees",
  ExceptionalExpenses: "Exceptional Expenses",
  PublicOffering: "Public Offering",
  Consent: "Consent",
  StudyBreakStartDate: `Study Break ${STUDY_BREAK_INDEX_PLACE_HOLDER} - Start Date`,
  StudyBreakEndDate: `Study Break ${STUDY_BREAK_INDEX_PLACE_HOLDER} - End Date`,
};

export class CSVStudyBreak {
  @IsDateString(undefined, {
    message: getDateFormatMessage(CSVHeaders.StudyBreakStartDate),
  })
  breakStartDate: string;
  @IsDateString(undefined, {
    message: getDateFormatMessage(CSVHeaders.StudyBreakEndDate),
  })
  breakEndDate: string;
}

export enum YesNoOptions {
  Yes = "yes",
  No = "no",
}

function getDateFormatMessage(header: string) {
  if (header.indexOf(STUDY_BREAK_INDEX_PLACE_HOLDER)) {
    header = header
      .replace(STUDY_BREAK_INDEX_PLACE_HOLDER, "") // Remove index place holder.
      .replace(/\s+/g, " "); // Remove duplicated white spaces.
  }
  return `${header} must be in the format ${DATE_FORMAT}`;
}

function getCurrencyFormatMessage(header: string) {
  return `${header} must be a number without a group separator or decimals.`;
}

function getEnumFormatMessage(header: string, enumObject: unknown) {
  return `${header} must be one of the following options: ${Object.values(
    enumObject,
  ).join()}`;
}

function getYesNoFormatMessage(header: string) {
  return getEnumFormatMessage(header, YesNoOptions);
}

export class OfferingCSVModel {
  @Matches(/^[A-Z]{4}$/, {
    message: `${CSVHeaders.LocationCode} must be a 4 letters uppercase code.`,
  })
  institutionLocationCode: string;
  @Matches(/^[[A-Z]{3}[0-9]{1}$/, {
    message: `${CSVHeaders.SABCProgramCode} must be a 3 uppercase letters followed by a number.`,
  })
  sabcProgramCode: string;
  @IsNotEmpty({ message: `${CSVHeaders.OfferingName} must be provided.` })
  offeringName: string;
  @IsDateString(undefined, {
    message: getDateFormatMessage(CSVHeaders.StudyStartDate),
  })
  studyStartDate: string;
  @IsDateString(undefined, {
    message: getDateFormatMessage(CSVHeaders.StudyEndDate),
  })
  studyEndDate: string;
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(CSVHeaders.ActualTuitionCosts),
  })
  actualTuitionCosts: number;
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(CSVHeaders.ProgramRelatedCosts),
  })
  programRelatedCosts: number;
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(CSVHeaders.MandatoryFees),
  })
  mandatoryFees: number;
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(CSVHeaders.ExceptionalExpenses),
  })
  exceptionalExpenses: number;
  @IsEnum(OfferingDeliveryOptions, {
    message: getEnumFormatMessage(
      CSVHeaders.DeliveredType,
      OfferingDeliveryOptions,
    ),
  })
  offeringDelivered: OfferingDeliveryOptions;
  @IsEnum(OfferingIntensity, {
    message: getEnumFormatMessage(
      CSVHeaders.OfferingIntensity,
      OfferingIntensity,
    ),
  })
  offeringIntensity: OfferingIntensity;
  @IsNumber()
  yearOfStudy: number;
  @IsEnum(YesNoOptions, {
    message: getYesNoFormatMessage(CSVHeaders.YearOfStudy),
  })
  showYearOfStudy: YesNoOptions;
  @IsEnum(YesNoOptions, {
    message: getYesNoFormatMessage(CSVHeaders.WILComponent),
  })
  WILComponent: YesNoOptions;
  @ValidateIf(
    (csvModel: OfferingCSVModel) => csvModel.WILComponent === YesNoOptions.Yes,
    {
      message: `${CSVHeaders.WILComponentType} is required when ${CSVHeaders.WILComponent} is set to '${YesNoOptions.Yes}'.`,
    },
  )
  @IsNotEmpty()
  WILComponentType?: string;
  @IsIn([YesNoOptions.Yes], {
    message: `${CSVHeaders.Consent} must be set to '${YesNoOptions.Yes}'.`,
  })
  consent: YesNoOptions;
  @IsEnum(YesNoOptions, {
    message: getYesNoFormatMessage(CSVHeaders.PublicOffering),
  })
  publicOffering: YesNoOptions;
  @IsOptional()
  @IsNumber()
  courseLoad?: number;
  @IsEnum(YesNoOptions, {
    message: getYesNoFormatMessage(CSVHeaders.HasStudyBreaks),
  })
  hasStudyBreaks: YesNoOptions;
  @ValidateIf(
    (csvModel: OfferingCSVModel) =>
      csvModel.hasStudyBreaks === YesNoOptions.Yes,
  )
  @Type(() => CSVStudyBreak)
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  studyBreaks: CSVStudyBreak[];
}

export interface OfferingCSVValidationResult {
  index: number;
  csvModel: OfferingCSVModel;
  errors: string[];
}
