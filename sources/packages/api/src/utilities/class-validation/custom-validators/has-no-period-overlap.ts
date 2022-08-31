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
 *
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
 *
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
