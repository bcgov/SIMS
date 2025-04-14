import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from "class-validator";

/**
 *  Check if the value is greater than the reference number.
 */
@ValidatorConstraint()
class IsNumberGreaterThanConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments): boolean {
    const [condition] = args.constraints;
    const referenceNumber = condition(args.object) as number;
    if (referenceNumber === null || referenceNumber === undefined) {
      return false;
    }
    return value > referenceNumber;
  }

  defaultMessage(args: ValidationArguments) {
    const [, propertyDisplayName] = args.constraints;
    return `${propertyDisplayName ?? args.property} input is not allowed.`;
  }
}

/**
 * Check if the value is greater than the reference number.
 * @param getReferenceNumber get reference number.
 * @param propertyDisplayName property display name.
 * @param validationOptions validations options.
 */
export function IsNumberGreaterThan(
  getReferenceNumber: (object: unknown) => number,
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "IsNumberGreaterThan",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [getReferenceNumber, propertyDisplayName],
      validator: IsNumberGreaterThanConstraint,
    });
  };
}
