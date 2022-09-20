import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { getDateOnlyFormat, isAfter } from "../../date-utils";

/**
 * Checks if the date decorated is after the date provided as a reference in the
 * parameter startDateProperty.
 */
@ValidatorConstraint()
class IsDateAfterConstraint implements ValidatorConstraintInterface {
  validate(value: Date | string, args: ValidationArguments): boolean {
    const [startDateProperty] = args.constraints;
    const periodStartDate = startDateProperty(args.object);
    if (!periodStartDate) {
      // The related property does not exists in the provided object to be compared.
      return false;
    }
    return isAfter(periodStartDate, value);
  }

  defaultMessage(args: ValidationArguments) {
    const [startDateProperty, propertyDisplayName] = args.constraints;
    const startDate = getDateOnlyFormat(startDateProperty(args.object));
    return `${
      propertyDisplayName ?? args.property
    } must be greater than ${startDate}.`;
  }
}

/**
 * Checks if the date decorated is after the date provided as a reference in the
 * parameter startDateProperty.
 * @param startDateProperty start date to be compared with the decorated one.
 * @param propertyDisplayName user-friendly property name to be added to the
 * validation message.
 * @param validationOptions validations options.
 * @returns true if the date property decorated is greater than the one
 * provided as a reference in the parameter startDateProperty.
 */
export function IsDateAfter(
  startDateProperty: (targetObject: unknown) => Date | string,
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "IsDateAfter",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startDateProperty, propertyDisplayName],
      validator: IsDateAfterConstraint,
    });
  };
}
