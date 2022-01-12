import { dateDifference, getDateDifferenceInMonth } from "./date-utils";
import { ProgramYear } from "../database/entities/program-year.model";

export const checkValidStudyPeriod = (
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
