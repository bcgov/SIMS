import {
  ValidateIf,
  ValidationOptions,
  registerDecorator,
} from "class-validator";

/**
 * Property decorator that makes the property optional when at least one of the
 * given properties (including the decorated one) has a value, otherwise the
 * property is reported as invalid.
 * Useful to prevent requests with no filters that would retrieve all the records.
 * When applied to every property, at least one of them must have a value.
 * @param properties properties of which at least one must have a value. When not provided,
 * all the properties of the validated object are considered. When provided, the error
 * is reported only on the first property of the list.
 * @param validationOptions validations options.
 */
export function IsOptionalIfAnyOtherProvided<T extends object>(
  properties?: Array<keyof T & string>,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const propertyName = propertyKey as string;
    ValidateIf((object: Record<string, unknown>) => {
      if (object[propertyName]) {
        return true;
      }
      const filters = properties ?? Object.keys(object);
      const isAnyProvided = filters.some((property) => !!object[property]);
      // The first property of an explicit list is the only one to report the error.
      return !isAnyProvided && (!properties || properties[0] === propertyName);
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
        defaultMessage(): string {
          return `At least one of the following must be provided: ${properties.join(", ")}.`;
        },
      },
    });
  };
}
