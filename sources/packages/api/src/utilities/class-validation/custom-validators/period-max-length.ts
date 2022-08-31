import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { dateDifference } from "../../date-utils";

/**
 *
 */
@ValidatorConstraint()
class PeriodMaxLengthConstraint implements ValidatorConstraintInterface {
  validate(value: Date | string, args: ValidationArguments): boolean {
    const [startDateProperty, maxDaysAllowed] = args.constraints;
    const periodStartDate = startDateProperty(args.object);
    if (!periodStartDate) {
      // The related property does not exists in the provided object to be compared.
      return false;
    }
    return dateDifference(value, periodStartDate) <= maxDaysAllowed;
  }

  defaultMessage(args: ValidationArguments) {
    const [startDateProperty, maxDaysAllowed] = args.constraints;
    return `The number of day(s) between ${startDateProperty(
      args.object,
    )} and ${args.property} must not greater than ${maxDaysAllowed}.`;
  }
}

/**
 *
 */
export function PeriodMaxLength(
  startDateProperty: (targetObject: unknown) => Date | string,
  maxDaysAllowed: number,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "PeriodMaxLength",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startDateProperty, maxDaysAllowed],
      validator: PeriodMaxLengthConstraint,
    });
  };
}
