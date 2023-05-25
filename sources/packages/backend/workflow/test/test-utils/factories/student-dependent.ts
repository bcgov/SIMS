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

/**
 * Creates a student dependent that will be eligible.
 * @param eligibility eligibility rule.
 * @returns an eligible dependent.
 */
export function createFakeStudentDependentEligible(
  eligibility: DependentEligibility,
): StudentDependent {
  switch (eligibility) {
    case DependentEligibility.Eligible0To18YearsOld:
      return {
        dateOfBirth: addToDateOnlyString(new Date(), -17.9, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.No,
      };
    case DependentEligibility.Eligible18To22YearsOldAttendingHighSchool:
      return {
        dateOfBirth: addToDateOnlyString(new Date(), -18.1, "years"),
        attendingPostSecondarySchool: YesNoOptions.Yes,
        declaredOnTaxes: YesNoOptions.No,
      };
    case DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes:
      return {
        dateOfBirth: addToDateOnlyString(new Date(), -22, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.Yes,
      };
    case DependentEligibility.EligibleOver22YearsOld:
      return {
        dateOfBirth: addToDateOnlyString(new Date(), -22.1, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.Yes,
      };
  }
}

/**
 * Creates a student dependent that wont be eligible.
 * @param eligibility eligibility rule to fail.
 * @returns an not eligible dependent.
 */
export function createFakeStudentDependentNotEligible(
  eligibility: DependentEligibility,
): StudentDependent {
  switch (eligibility) {
    case DependentEligibility.Eligible0To18YearsOld:
      return {
        dateOfBirth: addToDateOnlyString(new Date(), -23, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.No,
      };
    case DependentEligibility.Eligible18To22YearsOldAttendingHighSchool:
      return {
        dateOfBirth: addToDateOnlyString(new Date(), -18.1, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.No,
      };
    case DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes:
      return {
        dateOfBirth: addToDateOnlyString(new Date(), -22, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.No,
      };
    case DependentEligibility.EligibleOver22YearsOld:
      return {
        dateOfBirth: addToDateOnlyString(new Date(), -22.1, "years"),
        attendingPostSecondarySchool: YesNoOptions.No,
        declaredOnTaxes: YesNoOptions.No,
      };
  }
}
