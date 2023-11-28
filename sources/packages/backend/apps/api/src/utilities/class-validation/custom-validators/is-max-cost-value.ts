import { MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE } from "../..";
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from "class-validator";

/**
 * Checks if the value is greater than the money value for unknown max value.
 */
@ValidatorConstraint()
export class IsMaxCostValueConstraint implements ValidatorConstraintInterface {
  validate(value: number) {
    return value <= MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE;
  }

  defaultMessage(args: ValidationArguments) {
    const [propertyDisplayName] = args.constraints;
    return `${
      propertyDisplayName ?? args.property
    } must be not greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE}!`;
  }
}

/**
 * Checks if the value is greater than the money value for unknown max value.
 * @param propertyDisplayName user-friendly property name to be added to the
 * validation message.
 * @param validationOptions validations options.
 * @returns true if the date property decorated is less or equal to the money value for unknown max value.
 */
export function IsMaxCostValue(
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "IsMaxCostValue",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [propertyDisplayName],
      validator: IsMaxCostValueConstraint,
    });
  };
}
