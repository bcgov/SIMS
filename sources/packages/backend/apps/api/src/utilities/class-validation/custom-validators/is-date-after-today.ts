import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { getPSTPDTDateFormatted, isAfter } from "@sims/utilities";

/**
 * Checks if the decorated date is after the current date in PST time,
 * ensuring the value represents a future date regardless of the server
 * timezone.
 */
@ValidatorConstraint()
class IsDateAfterTodayConstraint implements ValidatorConstraintInterface {
  validate(value: Date | string): boolean {
    if (!value) {
      return false;
    }
    const todayInPSTTime = getPSTPDTDateFormatted(new Date());
    return isAfter(todayInPSTTime, value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a future date.`;
  }
}

/**
 * Checks if the decorated date is after the current date in PST time.
 * @param validationOptions validations options.
 * @returns true if the decorated date is greater than the current date in
 * PST time.
 */
export function IsDateAfterToday(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "IsDateAfterToday",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateAfterTodayConstraint,
    });
  };
}
