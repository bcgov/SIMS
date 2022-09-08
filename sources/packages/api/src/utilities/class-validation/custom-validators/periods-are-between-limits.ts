import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { isBetweenPeriod, Period } from "../..";
import { getPeriodStartDateProperty, getPeriodEndDateProperty } from "..";

/**
 * For an array of periods checks if every period is inside a
 * start date and end date limits.
 */
@ValidatorConstraint()
class PeriodsAreBetweenLimitsConstraint
  implements ValidatorConstraintInterface
{
  validate(values: unknown[], args: ValidationArguments): boolean {
    const period = this.getPeriodFromArguments(args);
    const [refTarget] = values;
    const periodStartDateProperty = getPeriodStartDateProperty(refTarget);
    const periodEndDateProperty = getPeriodEndDateProperty(refTarget);
    for (const value of values) {
      const startDate = value[periodStartDateProperty];
      // Checks if the start date is between the valid period.
      if (!isBetweenPeriod(startDate, period)) {
        return false;
      }
      // Checks if the end date is between the valid period.
      const endDate = value[periodEndDateProperty];
      if (!isBetweenPeriod(endDate, period)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const period: Period = this.getPeriodFromArguments(args);
    return `${args.property} must have all dates between ${period.startDate} and ${period.endDate}.`;
  }

  private getPeriodFromArguments(args: ValidationArguments): Period {
    const [startPeriodProperty, endPeriodProperty] = args.constraints;
    const startDate = startPeriodProperty(args.object);
    const endDate = endPeriodProperty(args.object);
    return { startDate, endDate };
  }
}

/**
 * For an array of periods checks if every period is inside a
 * start date and end date limits.
 * @param startPeriodProperty property of the model that identifies the offering start date.
 * @param endPeriodProperty property of the model that identifies the offering end date.
 * @param validationOptions validations options.
 * @returns true if all periods are inside the limits, otherwise, false.
 */
export function PeriodsAreBetweenLimits(
  startPeriodProperty: (targetObject: unknown) => Date | string,
  endPeriodProperty: (targetObject: unknown) => Date | string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "PeriodsAreBetweenLimits",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startPeriodProperty, endPeriodProperty],
      validator: PeriodsAreBetweenLimitsConstraint,
    });
  };
}
