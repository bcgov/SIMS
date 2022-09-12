import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { hasSomePeriodOverlap, Period } from "../../date-utils";
import { getPeriodEndDateProperty, getPeriodStartDateProperty } from "..";

/**
 * For an array of periods (any object with a start and end dates) checks if
 * there is any period with an overlap with any other period of the same array.
 */
@ValidatorConstraint()
class HasNoPeriodOverlapConstraint implements ValidatorConstraintInterface {
  validate(values: unknown[]): boolean {
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
    return `${args.property} has periods with overlaps.`;
  }
}

/**
 * For an array of periods (any object with a start and end dates) checks if
 * there is any period with an overlap with any other period of the same array.
 */
export function HasNoPeriodOverlap(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "HasNoPeriodOverlap",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: HasNoPeriodOverlapConstraint,
    });
  };
}
