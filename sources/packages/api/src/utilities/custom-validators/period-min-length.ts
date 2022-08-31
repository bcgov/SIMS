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
class PeriodMinLengthConstraint implements ValidatorConstraintInterface {
  validate(value: Date | string, args: ValidationArguments): boolean {
    const [periodStartDateProperty, minDaysAllowed] = args.constraints;
    const periodStartDate = args.object[periodStartDateProperty];
    if (!periodStartDate) {
      // The related property does not exists in the provided object to be compared.
      return false;
    }
    return dateDifference(value, periodStartDate) >= minDaysAllowed;
  }

  defaultMessage(args: ValidationArguments) {
    const [periodStartDateProperty, minDaysAllowed] = args.constraints;
    return `The number of day(s) between ${periodStartDateProperty} and ${args.property} must be at least ${minDaysAllowed}.`;
  }
}

/**
 *
 */
export function PeriodMinLength(
  periodStartDateProperty: string,
  minDaysAllowed: number,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "PeriodMinLength",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [periodStartDateProperty, minDaysAllowed],
      validator: PeriodMinLengthConstraint,
    });
  };
}
