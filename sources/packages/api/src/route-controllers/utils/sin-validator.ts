import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
} from "class-validator";

@ValidatorConstraint({ async: true })
export class IsValidSINConstraint implements ValidatorConstraintInterface {
  validate(sin: string): boolean {
    return sin?.length === 9;
  }
}

export function IsValidSIN(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "IsValidSIN",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsValidSINConstraint,
    });
  };
}
