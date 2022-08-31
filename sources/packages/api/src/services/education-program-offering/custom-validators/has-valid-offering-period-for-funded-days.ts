import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {
  OFFERING_STUDY_PERIOD_MAX_DAYS,
  OFFERING_STUDY_PERIOD_MIN_DAYS,
} from "../../../utilities";
import { StudyBreak } from "../education-program-offering-validation.models";
import { OfferingCalculationValidationBaseConstraint } from "./offering-calculation-validation-base-constraint";

/**
 *
 */
@ValidatorConstraint()
class HasValidOfferingPeriodForFundedDaysConstraint
  extends OfferingCalculationValidationBaseConstraint
  implements ValidatorConstraintInterface
{
  validate(studyBreaks: StudyBreak[], args: ValidationArguments): boolean {
    const calculatedStudyBreaksAndWeeks = this.getCalculatedStudyBreaks(
      studyBreaks,
      args,
    );
    return (
      calculatedStudyBreaksAndWeeks.fundedStudyPeriodDays >=
        OFFERING_STUDY_PERIOD_MIN_DAYS &&
      calculatedStudyBreaksAndWeeks.fundedStudyPeriodDays <=
        OFFERING_STUDY_PERIOD_MAX_DAYS
    );
  }

  defaultMessage() {
    return `The study period is ineligible for StudentAid BC funding. Your dates must be between ${OFFERING_STUDY_PERIOD_MIN_DAYS} to ${OFFERING_STUDY_PERIOD_MAX_DAYS} days`;
  }
}

/**
 *
 */
export function HasValidOfferingPeriodForFundedDays(
  startPeriodProperty: (targetObject: unknown) => Date | string,
  endPeriodProperty: (targetObject: unknown) => Date | string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "HasValidOfferingPeriodForFundedDays",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startPeriodProperty, endPeriodProperty],
      validator: HasValidOfferingPeriodForFundedDaysConstraint,
    });
  };
}
