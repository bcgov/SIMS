import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationArguments,
} from "class-validator";

/**
 * Max size validation for the json resulted from the annotated object.
 */
@ValidatorConstraint()
class JsonMaxSizeConstraint implements ValidatorConstraintInterface {
  validate(json: unknown, args: ValidationArguments): boolean {
    const [maxSize] = args.constraints;
    const stringifiedJson = JSON.stringify(json);
    return stringifiedJson ? stringifiedJson.length <= maxSize : true;
  }

  defaultMessage(args: ValidationArguments) {
    const [maxSize] = args.constraints;
    return `The length for ${args.targetName}.${args.property} should not be greater than ${maxSize} bytes.`;
  }
}
/**
 * Json max size validation.
 * @param maxSize maximum length in bytes.
 */
export function JsonMaxSize(maxSize: number) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "JsonMaxSize",
      target: object.constructor,
      propertyName,
      validator: JsonMaxSizeConstraint,
      constraints: [maxSize],
    });
  };
}
