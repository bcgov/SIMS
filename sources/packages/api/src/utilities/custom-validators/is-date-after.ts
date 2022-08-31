import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { isAfterByDay } from "../date-utils";

/**
 *
 */
@ValidatorConstraint()
class IsDateAfterConstraint implements ValidatorConstraintInterface {
  validate(value: Date | string, args: ValidationArguments): boolean {
    const relatedPropertyName = this.getRelatedPropertyName(args);
    const relatedValue = args.object[relatedPropertyName];
    if (!relatedValue) {
      // The related property does not exists in the provided object to be compared.
      return false;
    }
    return isAfterByDay(value, relatedValue);
  }

  defaultMessage(args: ValidationArguments) {
    const relatedPropertyName = this.getRelatedPropertyName(args);
    return `${args.property} must be a date after ${relatedPropertyName}.`;
  }

  private getRelatedPropertyName(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints;
    return relatedPropertyName;
  }
}

/**
 *
 */
export function IsDateAfter(
  relatedProperty: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "IsDateAfter",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [relatedProperty],
      validator: IsDateAfterConstraint,
    });
  };
}
