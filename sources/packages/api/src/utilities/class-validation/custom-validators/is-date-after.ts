import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { isAfterByDay } from "../../date-utils";

/**
 *
 */
@ValidatorConstraint()
class IsDateAfterConstraint implements ValidatorConstraintInterface {
  validate(value: Date | string, args: ValidationArguments): boolean {
    const startDate = this.getStartDate(args);
    if (!startDate) {
      // The related property does not exists in the provided object to be compared.
      return false;
    }
    return isAfterByDay(value, startDate);
  }

  defaultMessage(args: ValidationArguments) {
    const startDate = this.getStartDate(args);
    if (!startDate) {
      return `${args.property} has an undefined start date related value.`;
    }
    return `${args.property} must be a date after ${startDate}.`;
  }

  private getStartDate(args: ValidationArguments): Date | string | undefined {
    const [startDateProperty] = args.constraints;
    return startDateProperty(args.object);
  }
}

/**
 *
 */
export function IsDateAfter(
  startDateProperty: (targetObject: unknown) => Date | string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "IsDateAfter",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startDateProperty],
      validator: IsDateAfterConstraint,
    });
  };
}
