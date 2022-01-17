import { dateDifference, getDateDifferenceInMonth } from "./date-utils";
import { ProgramYear, OfferingIntensity } from "../database/entities";

/**
 * check valid study period
 * @param startDate start date.
 * @param endDate end date.
 * @returns error msg if the study period is not valid.
 */
export const checkNotValidStudyPeriod = (
  startDate: Date | string,
  endDate: Date | string,
): string => {
  if (startDate && endDate) {
    // calculate the no. of days between start and end date
    const Difference_In_Days = dateDifference(startDate, endDate);
    if (Difference_In_Days) {
      return Difference_In_Days >= 42 && Difference_In_Days <= 365
        ? ""
        : "Invalid Study Period, Dates must be between 42 and 365 days";
    }
  } else {
    return "Invalid Study dates";
  }
};

/**
 * check if study start date is within
 * program year student applied for
 * @param studyStartDate start date.
 * @param programYear programYear.
 * @returns [true] if study start date is
 * within program year student applied for
 * return [false] if not
 */
export const checkStudyStartDateWithinProgramYear = (
  studyStartDate: Date | string,
  programYear: ProgramYear,
): boolean => {
  if (studyStartDate && programYear)
    return (
      getDateDifferenceInMonth(studyStartDate, programYear.startDate) >= 0 &&
      getDateDifferenceInMonth(programYear.endDate, studyStartDate) >= 0
    );
};

/**
 * check if selected offering intensity
 * and intensity selected by student is same
 * @param application Application.
 * @param selectedOfferingIntensity selectedOfferingIntensity.
 * @returns [true] if selected offering intensity
 * and intensity selected by student is same
 * return [false] if not
 */
export const checkOfferingIntensityMismatch = (
  studentOfferingIntensity: OfferingIntensity,
  selectedOfferingIntensity: OfferingIntensity,
): boolean => {
  if (studentOfferingIntensity && selectedOfferingIntensity)
    return studentOfferingIntensity === selectedOfferingIntensity;
};
