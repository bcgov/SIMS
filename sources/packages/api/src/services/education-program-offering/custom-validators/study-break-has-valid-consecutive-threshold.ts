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
 *
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
    return calculatedStudyBreaksAndWeeks.sumOfTotalIneligibleBreakDays === 0;
  }

  defaultMessage() {
    const displayPercentage =
      OFFERING_VALIDATIONS_STUDY_BREAK_COMBINED_PERCENTAGE_THRESHOLD * 100;
    return `The combined study breaks exceed the ${displayPercentage}% threshold as outlined in StudentAid BC policy.`;
  }
}

/**
 *
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
