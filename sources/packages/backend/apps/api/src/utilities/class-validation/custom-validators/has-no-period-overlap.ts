import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { hasSomePeriodOverlap, Period } from "@sims/utilities";
import { getPeriodEndDateProperty, getPeriodStartDateProperty } from "..";

/**
 * For an array of periods (any object with a start and end dates) checks if
 * there is any period with an overlap with any other period of the same array.
 */
@ValidatorConstraint()
class HasNoPeriodOverlapConstraint implements ValidatorConstraintInterface {
  validate(values: unknown[]): boolean {
    if (!values) return true;
    const [refTarget] = values;
    const periodStartDateProperty = getPeriodStartDateProperty(refTarget);
    const periodEndDateProperty = getPeriodEndDateProperty(refTarget);
    const periods: Period[] = values.map((value) => {
      const startDate = value[periodStartDateProperty];
      const endDate = value[periodEndDateProperty];
      return { startDate, endDate };
    });
    return !hasSomePeriodOverlap(periods);
  }

  defaultMessage(args: ValidationArguments) {
    const [propertyDisplayName] = args.constraints;
    return `${propertyDisplayName ?? args.property} has periods with overlaps.`;
  }
}

/**
 * For an array of periods (any object with a start and end dates) checks if
 * there is any period with an overlap with any other period of the same array.
 * @param propertyDisplayName user-friendly property name to be added to the
 * validation message.
 * @param validationOptions validation options.
 * @returns true if there are no overlaps between all periods, otherwise, false.
 */
export function HasNoPeriodOverlap(
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "HasNoPeriodOverlap",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [propertyDisplayName],
      validator: HasNoPeriodOverlapConstraint,
    });
  };
}
