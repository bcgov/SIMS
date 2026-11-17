import {
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from "class-validator";

/**
 * Property decorator that makes the property optional when at least one of the
 * properties of the validated object (including the decorated one) has a value,
 * otherwise the property is reported as invalid.
 * Useful to prevent requests with no filters that would retrieve all the records.
 * When none is provided, the error is reported only on the first property.
 * The properties are read from the validated object, which exposes all the declared
 * class properties (even when empty) because class fields are emitted as own properties.
 * @param validationOptions validations options.
 */
export function IsOptionalIfAnyOtherProvided(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const propertyName = propertyKey as string;
    ValidateIf((object: Record<string, unknown>) => {
      if (object[propertyName]) {
        return true;
      }
      const properties = Object.keys(object);
      const isAnyProvided = properties.some((property) => !!object[property]);
      return !isAnyProvided && properties[0] === propertyName;
    })(target, propertyKey);
    registerDecorator({
      name: "IsOptionalIfAnyOtherProvided",
      target: target.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return !!value;
        },
        defaultMessage(args: ValidationArguments): string {
          return `At least one of the following must be provided: ${Object.keys(args.object).join(", ")}.`;
        },
      },
    });
  };
}
