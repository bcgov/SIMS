import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

/**
 * Max size validation for the json resulted from the annotated object.
 */
@ValidatorConstraint()
class JsonMaxSizeConstraint implements ValidatorConstraintInterface {
  validate(json: object, args: ValidationArguments): boolean {
    const [maxSize] = args.constraints;
    const stringifiedJson = JSON.stringify(json);
    if (stringifiedJson.length > maxSize) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const [maxSize] = args.constraints;
    return `The length for ${args.targetName}.${args.property} should not be greater than ${maxSize} bytes.`;
  }
}

export function JsonMaxSize(
  maxSize: number,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "JsonMaxSize",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: JsonMaxSizeConstraint,
      constraints: [maxSize],
    });
  };
}
