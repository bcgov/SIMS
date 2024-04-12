import { StudentDependent } from "workflow/test/models";
import { addToDateOnlyString } from "@sims/utilities";
import { YesNoOptions } from "@sims/test-utils";

export enum DependentEligibility {
  /**
   * Dependent has between 0 to 18 years old.
   */
  Eligible0To18YearsOld = "Eligible0To18YearsOld",
  /**
   * Dependent has more than 18 and less than 22 years old and
   * he is attending post secondary school.
   */
  Eligible18To22YearsOldAttendingHighSchool = "Eligible18To22YearsOldAttendingHighSchool",
  /**
   * Dependent has more than 18 and less than 22 years old and he declared on taxes.
   */
  Eligible18To22YearsOldDeclaredOnTaxes = "Eligible18To22YearsOldDeclaredOnTaxes",
  /**
   * Dependent is over 22 and is declared on taxes.
   */
  EligibleOver22YearsOld = "EligibleOver22YearsOld",
}

export enum DependentChildCareEligibility {
  /**
   * Dependent of age between 0 and 11 years.
   */
  Eligible0To11YearsOld = "Eligible0To11YearsOld",
  /**
   * Dependent of age above 12 years and declared on taxes for disability.
   */
  Eligible12YearsAndOver = "Eligible12YearsAndOver",
}

/**
 * Creates a student dependent that will be eligible.
 * @param eligibility eligibility rule.
 * @param studyStartDate study start date of the offering.
 * @param options method options.
 * - `referenceDate` reference date to define the dependent birthday.
 * @returns an eligible dependent.
 */
export function createFakeStudentDependentEligible(
  eligibility: DependentEligibility,
  options?: { referenceDate?: Date | string },
): StudentDependent {
  const referenceDate = options?.referenceDate ?? new Date();
  switch (eligibility) {
    case DependentEligibility.Eligible0To18YearsOld:
      return {
        dateOfBirth: addToDateOnlyString(referenceDate, -17, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.No,
      };
    case DependentEligibility.Eligible18To22YearsOldAttendingHighSchool:
      return {
        dateOfBirth: addToDateOnlyString(referenceDate, -19, "years"),
        attendingPostSecondarySchool: YesNoOptions.Yes,
        declaredOnTaxes: YesNoOptions.No,
      };
    case DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes:
      return {
        dateOfBirth: addToDateOnlyString(referenceDate, -22, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.Yes,
      };
    case DependentEligibility.EligibleOver22YearsOld:
      return {
        dateOfBirth: addToDateOnlyString(referenceDate, -23, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.Yes,
      };
  }
}

/**
 * Creates a student dependent that wont be eligible.
 * @param eligibility eligibility rule to fail.
 * @param studyStartDate study start date of the offering.
 * @param options?: { referenceDate?: Date | string },
 * - `referenceDate` reference date to define the dependent birthday.
 * @returns an not eligible dependent.
 */
export function createFakeStudentDependentNotEligible(
  eligibility: DependentEligibility,
  options?: { referenceDate?: Date | string },
): StudentDependent {
  const referenceDate = options?.referenceDate ?? new Date();
  switch (eligibility) {
    case DependentEligibility.Eligible0To18YearsOld:
      return {
        dateOfBirth: addToDateOnlyString(referenceDate, -21, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.No,
      };
    case DependentEligibility.Eligible18To22YearsOldAttendingHighSchool:
      return {
        dateOfBirth: addToDateOnlyString(referenceDate, -19, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.No,
      };
    case DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes:
      return {
        dateOfBirth: addToDateOnlyString(referenceDate, -22, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.No,
      };
    case DependentEligibility.EligibleOver22YearsOld:
      return {
        dateOfBirth: addToDateOnlyString(referenceDate, -23, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.No,
      };
  }
}

/**
 * Create a student dependant who is eligible for child care costs.
 * @param eligibility eligibility rule.
 * @param studyStartDate study start date of the offering.
 * @returns eligible dependant.
 */
export function createFakeStudentDependentEligibleForChildcareCost(
  eligibility: DependentChildCareEligibility,
  studyStartDate: Date | string,
): StudentDependent {
  switch (eligibility) {
    case DependentChildCareEligibility.Eligible0To11YearsOld:
      return {
        dateOfBirth: addToDateOnlyString(studyStartDate, -11, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.No,
      };
    case DependentChildCareEligibility.Eligible12YearsAndOver:
      return {
        dateOfBirth: addToDateOnlyString(studyStartDate, -12, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.Yes,
      };
  }
}

/**
 * Create a student dependant who is not eligible for child care costs.
 * @param studyStartDate study start date of the offering.
 * @returns dependant who is not eligible.
 */
export function createFakeStudentDependentNotEligibleForChildcareCost(
  studyStartDate: Date | string,
): StudentDependent {
  return {
    dateOfBirth: addToDateOnlyString(studyStartDate, -12, "years"),
    attendingPostSecondarySchool: YesNoOptions.No,
    declaredOnTaxes: YesNoOptions.No,
  };
}

/**
 * Create a student dependent who is born after study end date.
 * @param studyEndDate study end date of the offering.
 * @returns dependent born after study end date.
 */
export function createFakeStudentDependentBornAfterStudyEndDate(
  studyEndDate: Date | string,
): StudentDependent {
  return {
    dateOfBirth: addToDateOnlyString(studyEndDate, 1, "day"),
    attendingPostSecondarySchool: YesNoOptions.No,
    declaredOnTaxes: YesNoOptions.No,
  };
}
