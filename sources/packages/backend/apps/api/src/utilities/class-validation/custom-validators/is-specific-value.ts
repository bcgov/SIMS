import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from "class-validator";

/**
 * Validates if the value is equal to the expected value.
 */
@ValidatorConstraint()
class IsSpecificValueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === null || value === undefined || value === "") {
      return true;
    }
    const [, expectedValue] = args.constraints;
    return value !== expectedValue;
  }

  defaultMessage(args: ValidationArguments) {
    const [propertyDisplayName] = args.constraints;
    return `${propertyDisplayName} is not eligible for funding.`;
  }
}

/**
 * Validates if the value is equal to the expected value.
 * @param expectedValue expected value to compare against.
 * @param validationOptions validations options.
 */
export function IsSpecificValue(
  propertyDisplayName: string,
  expectedValue: unknown,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "IsSpecificValue",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [propertyDisplayName, expectedValue],
      validator: IsSpecificValueConstraint,
    });
  };
}
