import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { isBetweenPeriod, Period } from "..";
import { getPeriodEndDateProperty, getPeriodStartDateProperty } from ".";

/**
 *
 */
@ValidatorConstraint()
class PeriodsAreBetweenLimitsConstraint
  implements ValidatorConstraintInterface
{
  validate(values: unknown[], args: ValidationArguments): boolean {
    const [startPeriodProperty, endPeriodProperty] = args.constraints;
    const minStartDate = args.object[startPeriodProperty];
    const maxEndDate = args.object[endPeriodProperty];
    const period: Period = { startDate: minStartDate, endDate: maxEndDate };

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
    const [startPeriodProperty, endPeriodProperty] = args.constraints;
    return `${args.property} must have all dates between the period defined by ${startPeriodProperty} and ${endPeriodProperty}.`;
  }
}

/**
 *
 */
export function PeriodsAreBetweenLimits(
  startPeriodProperty: string,
  endPeriodProperty: string,
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
