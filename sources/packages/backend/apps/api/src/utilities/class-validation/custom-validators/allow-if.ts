import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from "class-validator";

/**
 * Allow a value to the property only if a condition is met.
 * This validates the property against receiving a value when is it not suppose to.
 */
@ValidatorConstraint()
class AllowIfConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === null || value === undefined || value === "") {
      return true;
    }
    const [condition] = args.constraints;
    const isAllowed = condition(args.object) as boolean;
    return isAllowed;
  }

  defaultMessage(args: ValidationArguments) {
    const [, propertyDisplayName] = args.constraints;
    return `${propertyDisplayName ?? args.property} input is not allowed.`;
  }
}

/**
 * Allow a value to the property only if a condition is met.
 * @param condition condition to allow value to a property.
 * @param propertyDisplayName property display name.
 * @param validationOptions validations options.
 */
export function AllowIf(
  condition: (object: unknown) => boolean,
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "AllowIf",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [condition, propertyDisplayName],
      validator: AllowIfConstraint,
    });
  };
}
