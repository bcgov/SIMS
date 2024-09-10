import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {
  OfferingValidationModel,
  StudyBreak,
} from "../education-program-offering-validation.models";
import { OfferingCalculationValidationBaseConstraint } from "./offering-calculation-validation-base-constraint";
import { OfferingIntensity } from "@sims/sims-db";

/**
 * For an offering that contains study breaks, execute the calculation
 * of the funded study period to validate if it matches the minimum
 * allowed study period amount of funded weeks.
 */
@ValidatorConstraint()
class HasValidOfferingPeriodForFundedWeeksConstraint
  extends OfferingCalculationValidationBaseConstraint
  implements ValidatorConstraintInterface
{
  validate(studyBreaks: StudyBreak[], args: ValidationArguments): boolean {
    const offeringMinFundedWeeksAllowedValue =
      this.getOfferingMinAllowedWeeks(args);
    const calculatedStudyBreaksAndWeeks = this.getCalculatedStudyBreaks(
      studyBreaks,
      args,
    );
    return (
      calculatedStudyBreaksAndWeeks.totalFundedWeeks >=
      offeringMinFundedWeeksAllowedValue
    );
  }

  defaultMessage(args: ValidationArguments) {
    const offeringMinFundedWeeksAllowedValue =
      this.getOfferingMinAllowedWeeks(args);
    const validationObject = args.object as OfferingValidationModel;
    const offeringIntensity =
      validationObject.offeringIntensity === OfferingIntensity.fullTime
        ? "Full-time"
        : "Part-time";
    return (
      `${offeringIntensity} offerings must be at least ${offeringMinFundedWeeksAllowedValue} funded weeks of study or longer to be eligible. ` +
      "Any shorter offerings can be submitted but will require SABC review."
    );
  }

  /**
   * Get offering minimum allowed weeks from args.
   * @param args validation arguments.
   * @returns minimum allowed weeks.
   */
  private getOfferingMinAllowedWeeks(args: ValidationArguments): number {
    const [, , offeringMinWeeksAllowed] = args.constraints;
    return offeringMinWeeksAllowed(args.object) as number;
  }
}

/**
 * For an offering that contains study breaks, execute the calculation
 * of the funded study period to validate if it matches the minimum
 * allowed study period amount of funded weeks.
 * @param startPeriodProperty property of the model that identifies the offering start date.
 * @param endPeriodProperty property of the model that identifies the offering end date.
 * @param offeringMinFundedWeeksAllowed study period minimum funded length in number of weeks.
 * @param validationOptions validations options.
 * @returns true if the study period is valid, otherwise, false.
 */
export function HasValidOfferingPeriodForFundedWeeks(
  startPeriodProperty: (targetObject: unknown) => Date | string,
  endPeriodProperty: (targetObject: unknown) => Date | string,
  offeringMinFundedWeeksAllowed: (targetObject: unknown) => number,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "HasValidOfferingPeriodForFundedWeeks",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [
        startPeriodProperty,
        endPeriodProperty,
        offeringMinFundedWeeksAllowed,
      ],
      validator: HasValidOfferingPeriodForFundedWeeksConstraint,
    });
  };
}
