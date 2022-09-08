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
import { removeDoubleWhiteSpaces } from "../../utilities";
import { OfferingIntensity } from "../../database/entities";
import {
  currencyNumberOptions,
  OfferingDeliveryOptions,
} from "./education-program-offering-validation.models";

/**
 * Expected date format to be received from the CSV.
 */
const DATE_FORMAT = "YYYY-MM-DD";

/**
 * For study breaks periods, this is the place holder to receive the array index.
 */
export const STUDY_BREAK_INDEX_PLACE_HOLDER = "{index}";

/**
 * user-friendly header names used in the CSV to be populated by the user.
 * The CSV model parser uses this as a base to parse the CSV string into an object model.
 */
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

/**
 * Study breaks periods.
 */
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

/**
 * Used by CSV fields that need provide yes/no (true/false like information).
 */
export enum YesNoOptions {
  Yes = "yes",
  No = "no",
}

/**
 * Provides a user-friendly message to a field that needs date validation.
 * @param header friendly header name.
 * @returns friendly message to the field the that needs date validation.
 */
function getDateFormatMessage(header: string) {
  if (header.indexOf(STUDY_BREAK_INDEX_PLACE_HOLDER)) {
    // Remove index place holder.
    header = header.replace(STUDY_BREAK_INDEX_PLACE_HOLDER, "");
    // Remove white spaces that are leftovers after index place holder removal.
    header = removeDoubleWhiteSpaces(header);
  }
  return `${header} must be in the format ${DATE_FORMAT}`;
}

/**
 * Provides a user-friendly message to a field that needs currency validation.
 * @param header friendly header name.
 * @returns friendly message to the field the that needs currency validation.
 */
function getCurrencyFormatMessage(header: string) {
  return `${header} must be a number without a group separator or decimals.`;
}

/**
 * Provides a user-friendly message to a field that needs a enum like validation.
 * @param header friendly header name.
 * @returns friendly message to the field the that needs a enum like validation.
 */
function getEnumFormatMessage(header: string, enumObject: unknown) {
  return `${header} must be one of the following options: ${Object.values(
    enumObject,
  ).join()}`;
}

/**
 * Provides a user-friendly message to a field that needs a yes/no validation.
 * @param header friendly header name.
 * @returns friendly message to the field the that needs yes/no like validation.
 */
function getYesNoFormatMessage(header: string) {
  return getEnumFormatMessage(header, YesNoOptions);
}

export class OfferingCSVModel {
  /**
   * Institution location code that uniquely identifies a location in the institution.
   */
  @Matches(/^[A-Z]{4}$/, {
    message: `${CSVHeaders.LocationCode} must be a 4 letters uppercase code.`,
  })
  institutionLocationCode: string;
  /**
   * SABC program code that uniquely identifies a program for an institution.
   */
  @Matches(/^[[A-Z]{3}\d{1}$/, {
    message: `${CSVHeaders.SABCProgramCode} must be a 3 uppercase letters followed by a number.`,
  })
  sabcProgramCode: string;
  /**
   * Offering name.
   */
  @IsNotEmpty({ message: `${CSVHeaders.OfferingName} must be provided.` })
  offeringName: string;
  /**
   * Offering study start date.
   */
  @IsDateString(undefined, {
    message: getDateFormatMessage(CSVHeaders.StudyStartDate),
  })
  studyStartDate: string;
  /**
   * Offering study end date.
   */
  @IsDateString(undefined, {
    message: getDateFormatMessage(CSVHeaders.StudyEndDate),
  })
  studyEndDate: string;
  /**
   * Actual tuition costs.
   */
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(CSVHeaders.ActualTuitionCosts),
  })
  actualTuitionCosts: number;
  /**
   * Program related costs.
   */
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(CSVHeaders.ProgramRelatedCosts),
  })
  programRelatedCosts: number;
  /**
   * Mandatory fees.
   */
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(CSVHeaders.MandatoryFees),
  })
  mandatoryFees: number;
  /**
   * Exceptional expenses.
   */
  @IsNumber(currencyNumberOptions, {
    message: getCurrencyFormatMessage(CSVHeaders.ExceptionalExpenses),
  })
  exceptionalExpenses: number;
  /**
   * Offering delivered type.
   */
  @IsEnum(OfferingDeliveryOptions, {
    message: getEnumFormatMessage(
      CSVHeaders.DeliveredType,
      OfferingDeliveryOptions,
    ),
  })
  offeringDelivered: OfferingDeliveryOptions;
  /**
   * Offering intensity.
   */
  @IsEnum(OfferingIntensity, {
    message: getEnumFormatMessage(
      CSVHeaders.OfferingIntensity,
      OfferingIntensity,
    ),
  })
  offeringIntensity: OfferingIntensity;
  /**
   * Number of years of study.
   */
  @IsNumber()
  yearOfStudy: number;
  /**
   * Show year of study.
   */
  @IsEnum(YesNoOptions, {
    message: getYesNoFormatMessage(CSVHeaders.YearOfStudy),
  })
  showYearOfStudy: YesNoOptions;
  /**
   * Indicates if the offering has a WIL(work-integrated learning).
   */
  @IsEnum(YesNoOptions, {
    message: getYesNoFormatMessage(CSVHeaders.WILComponent),
  })
  WILComponent: YesNoOptions;
  /**
   * For an offering that has a WIL(work-integrated learning),
   * indicates which type.
   */
  @ValidateIf(
    (csvModel: OfferingCSVModel) => csvModel.WILComponent === YesNoOptions.Yes,
    {
      message: `${CSVHeaders.WILComponentType} is required when ${CSVHeaders.WILComponent} is set to '${YesNoOptions.Yes}'.`,
    },
  )
  @IsNotEmpty()
  WILComponentType?: string;
  /**
   * User consent to have the offering submitted.
   */
  @IsIn([YesNoOptions.Yes], {
    message: `${CSVHeaders.Consent} must be set to '${YesNoOptions.Yes}'.`,
  })
  consent: YesNoOptions;
  /**
   * Indicates if the offering should be available for every student to select.
   */
  @IsEnum(YesNoOptions, {
    message: getYesNoFormatMessage(CSVHeaders.PublicOffering),
  })
  publicOffering: YesNoOptions;
  /**
   * Indicates offering course load.
   */
  @IsOptional()
  @IsNumber()
  courseLoad?: number;
  /**
   * Indicates if the offering has some study break.
   */
  @IsEnum(YesNoOptions, {
    message: getYesNoFormatMessage(CSVHeaders.HasStudyBreaks),
  })
  hasStudyBreaks: YesNoOptions;
  /**
   * For offerings with some study break, represents all study break periods.
   */
  @ValidateIf(
    (csvModel: OfferingCSVModel) =>
      csvModel.hasStudyBreaks === YesNoOptions.Yes,
  )
  @Type(() => CSVStudyBreak)
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  studyBreaks: CSVStudyBreak[];
}

/**
 * Represents the validation performed on a CSV model.
 */
export interface OfferingCSVValidationResult {
  /**
   * Zero base index of the record in the list of the records.
   * Does not consider possible header.
   */
  index: number;
  /**
   * Model that was validated.
   */
  csvModel: OfferingCSVModel;
  /**
   * List of possible errors. If no error is present it
   * means the model was successfully validated.
   */
  errors: string[];
}
