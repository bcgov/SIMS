import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from "class-validator";

/**
 * Class decorator that ensures at least one of the given properties of the object has a value.
 * Useful to prevent requests with no filters that would retrieve all the records.
 * @param properties properties of which at least one must have a value.
 * @param validationOptions validations options.
 */
export function IsAnyProvided<T extends object>(
  properties: Array<keyof T & string>,
  validationOptions?: ValidationOptions,
): ClassDecorator {
  return (target) => {
    registerDecorator({
      name: "IsAnyProvided",
      target,
      // Class-level validation is not tied to any property.
      propertyName: undefined as unknown as string,
      options: validationOptions,
      constraints: [properties],
      validator: {
        validate(_value: unknown, args: ValidationArguments): boolean {
          const [requiredProperties] = args.constraints as [string[]];
          return requiredProperties.some(
            (property) => !!(args.object as Record<string, unknown>)[property],
          );
        },
        defaultMessage(args: ValidationArguments): string {
          const [requiredProperties] = args.constraints as [string[]];
          return `At least one of the following must be provided: ${requiredProperties.join(", ")}.`;
        },
      },
    });
  };
}
