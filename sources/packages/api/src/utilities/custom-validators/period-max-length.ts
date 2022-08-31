import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { dateDifference } from "../date-utils";

/**
 *
 */
@ValidatorConstraint()
class PeriodMaxLengthConstraint implements ValidatorConstraintInterface {
  validate(value: Date | string, args: ValidationArguments): boolean {
    const [periodStartDateProperty, maxDaysAllowed] = args.constraints;
    const periodStartDate = args.object[periodStartDateProperty];
    if (!periodStartDate) {
      // The related property does not exists in the provided object to be compared.
      return false;
    }
    return dateDifference(value, periodStartDate) <= maxDaysAllowed;
  }

  defaultMessage(args: ValidationArguments) {
    const [periodStartDateProperty, maxDaysAllowed] = args.constraints;
    return `The number of day(s) between ${periodStartDateProperty} and ${args.property} must not greater than ${maxDaysAllowed}.`;
  }
}

/**
 *
 */
export function PeriodMaxLength(
  periodStartDateProperty: string,
  maxDaysAllowed: number,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "PeriodMaxLength",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [periodStartDateProperty, maxDaysAllowed],
      validator: PeriodMaxLengthConstraint,
    });
  };
}
