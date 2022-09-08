import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { OFFERING_VALIDATIONS_STUDY_BREAK_COMBINED_PERCENTAGE_THRESHOLD } from "../../../utilities";
import { StudyBreak } from "../education-program-offering-validation.models";
import { OfferingCalculationValidationBaseConstraint } from "./offering-calculation-validation-base-constraint";

/**
 * For an offering that contains study breaks, there is maximum amount
 * of study break days allowed that is represented by a percentage of the
 * total days in the offering period. For instance, for an offering that
 * has 200 days and considering a 10% maximum days allowed, the sun of
 * all study breaks cannot exceed 20 days.
 */
@ValidatorConstraint()
class StudyBreaksCombinedMustNotExceedsThresholdConstraint
  extends OfferingCalculationValidationBaseConstraint
  implements ValidatorConstraintInterface
{
  validate(studyBreaks: StudyBreak[], args: ValidationArguments): boolean {
    const calculatedStudyBreaksAndWeeks = this.getCalculatedStudyBreaks(
      studyBreaks,
      args,
    );
    return (
      calculatedStudyBreaksAndWeeks.sumOfTotalEligibleBreakDays <=
      calculatedStudyBreaksAndWeeks.allowableStudyBreaksDaysAmount
    );
  }

  defaultMessage() {
    const displayPercentage =
      OFFERING_VALIDATIONS_STUDY_BREAK_COMBINED_PERCENTAGE_THRESHOLD * 100;
    return `The combined study breaks exceed the ${displayPercentage}% threshold as outlined in StudentAid BC policy.`;
  }
}

/**
 * For an offering that contains study breaks, there is maximum amount
 * of study break days allowed that is represented by a percentage of the
 * total days in the offering period. For instance, for an offering that
 * has 200 days and considering a 10% maximum days allowed, the sun of
 * all study breaks cannot exceed 20 days.
 * @param startPeriodProperty property of the model that identifies the offering start date.
 * @param endPeriodProperty property of the model that identifies the offering end date.
 * @param validationOptions validations options.
 * @returns true if the study period is valid, otherwise, false.
 */
export function StudyBreaksCombinedMustNotExceedsThreshold(
  startPeriodProperty: (targetObject: unknown) => Date | string,
  endPeriodProperty: (targetObject: unknown) => Date | string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "StudyBreaksCombinedMustNotExceedsThreshold",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startPeriodProperty, endPeriodProperty],
      validator: StudyBreaksCombinedMustNotExceedsThresholdConstraint,
    });
  };
}
