import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { OFFERING_STUDY_PERIOD_MAX_DAYS } from "../../../utilities";
import { StudyBreak } from "../education-program-offering-validation.models";
import { OfferingCalculationValidationBaseConstraint } from "./offering-calculation-validation-base-constraint";

/**
 * For an offering that contains study breaks, execute the calculation
 * of the funded study period to validate if it matches the mix and max
 * allowed study period amount of days.
 */
@ValidatorConstraint()
class HasValidOfferingPeriodForFundedDaysConstraint
  extends OfferingCalculationValidationBaseConstraint
  implements ValidatorConstraintInterface
{
  validate(studyBreaks: StudyBreak[], args: ValidationArguments): boolean {
    const offeringMinDaysAllowedValue = this.getOfferingMinAllowedDays(args);
    const calculatedStudyBreaksAndWeeks = this.getCalculatedStudyBreaks(
      studyBreaks,
      args,
    );
    return (
      calculatedStudyBreaksAndWeeks.fundedStudyPeriodDays >=
        offeringMinDaysAllowedValue &&
      calculatedStudyBreaksAndWeeks.fundedStudyPeriodDays <=
        OFFERING_STUDY_PERIOD_MAX_DAYS
    );
  }

  defaultMessage(args: ValidationArguments) {
    const offeringMinDaysAllowedValue = this.getOfferingMinAllowedDays(args);
    return `The funded study amount of days is ineligible for StudentAid BC funding. Your dates must be between ${offeringMinDaysAllowedValue} to ${OFFERING_STUDY_PERIOD_MAX_DAYS} days.`;
  }

  /**
   * Get offering minimum allowed days from args.
   * @param args validation arguments.
   * @returns minimum allowed days.
   */
  private getOfferingMinAllowedDays(args: ValidationArguments): number {
    const [, , offeringMinDaysAllowed] = args.constraints;
    return offeringMinDaysAllowed(args.object) as number;
  }
}

/**
 * For an offering that contains study breaks, execute the calculation
 * of the funded study period to validate if it matches the mix and max
 * allowed study period amount of days.
 * @param startPeriodProperty property of the model that identifies the offering start date.
 * @param endPeriodProperty property of the model that identifies the offering end date.
 * @param offeringMinDaysAllowed study period minimum length in number of days.
 * @param validationOptions validations options.
 * @returns true if the study period is valid, otherwise, false.
 */
export function HasValidOfferingPeriodForFundedDays(
  startPeriodProperty: (targetObject: unknown) => Date | string,
  endPeriodProperty: (targetObject: unknown) => Date | string,
  offeringMinDaysAllowed: (targetObject: unknown) => number,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "HasValidOfferingPeriodForFundedDays",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [
        startPeriodProperty,
        endPeriodProperty,
        offeringMinDaysAllowed,
      ],
      validator: HasValidOfferingPeriodForFundedDaysConstraint,
    });
  };
}
