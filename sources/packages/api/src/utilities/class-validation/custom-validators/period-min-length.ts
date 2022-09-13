import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { dateDifference, getISODateOnlyString } from "../../date-utils";

/**
 * Checks if the number of days between the property date decorated with this
 * validator (must be the end date) and a start date indicated by the
 * startDateProperty parameter have the min allowed number of days.
 */
@ValidatorConstraint()
class PeriodMinLengthConstraint implements ValidatorConstraintInterface {
  validate(value: Date | string, args: ValidationArguments): boolean {
    const [startDateProperty, minDaysAllowed] = args.constraints;
    const periodStartDate = startDateProperty(args.object);
    if (!periodStartDate) {
      // The related property does not exists in the provided object to be compared.
      return false;
    }
    return dateDifference(value, periodStartDate) >= minDaysAllowed;
  }

  defaultMessage(args: ValidationArguments) {
    const [startDateProperty, minDaysAllowed, propertyDisplayName] =
      args.constraints;
    const startDate = getISODateOnlyString(startDateProperty(args.object));
    const endDate = getISODateOnlyString(args.value);
    return `${
      propertyDisplayName ?? args.property
    }, the number of day(s) between ${startDate} and ${endDate} must be at least ${minDaysAllowed}.`;
  }
}

/**
 * Checks if the number of days between the property date decorated with this
 * validator (must be the end date) and a start date, indicated by the
 * startDateProperty parameter, have the min allowed number of days.
 * @param startDateProperty indicates the property that define the
 * start of a period.
 * @param minDaysAllowed min allowed days to the period be considered valid.
 * @param propertyDisplayName user-friendly property name to be added to the
 * validation message.
 * @param validationOptions validations options.
 * @returns true if the period amount of days is inside the min allowed days.
 */
export function PeriodMinLength(
  startDateProperty: (targetObject: unknown) => Date | string,
  minDaysAllowed: number,
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "PeriodMinLength",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startDateProperty, minDaysAllowed, propertyDisplayName],
      validator: PeriodMinLengthConstraint,
    });
  };
}
