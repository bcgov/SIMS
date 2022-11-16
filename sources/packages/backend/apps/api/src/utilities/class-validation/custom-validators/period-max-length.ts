import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { dateDifference, getDateOnlyFormat } from "@sims/utilities";

/**
 * Checks if the number of days between the property date decorated with this
 * validator (must be the end date) and a start date indicated by the
 * startDateProperty parameter have the max allowed number of days.
 */
@ValidatorConstraint()
class PeriodMaxLengthConstraint implements ValidatorConstraintInterface {
  validate(value: Date | string, args: ValidationArguments): boolean {
    const [startDateProperty, maxDaysAllowed] = args.constraints;
    const periodStartDate = startDateProperty(args.object);
    if (!value || !periodStartDate) {
      // While the two dates are not provided just ignore this validation.
      // The presence of both dates must be ensured by other validators.
      return true;
    }
    return dateDifference(value, periodStartDate) <= maxDaysAllowed;
  }

  defaultMessage(args: ValidationArguments) {
    const [startDateProperty, maxDaysAllowed, propertyDisplayName] =
      args.constraints;
    const startDate = getDateOnlyFormat(startDateProperty(args.object));
    const endDate = getDateOnlyFormat(args.value);
    return `${
      propertyDisplayName ?? args.property
    }, the number of day(s) between ${startDate} and ${endDate} must not be greater than ${maxDaysAllowed}.`;
  }
}

/**
 * Checks if the number of days between the property date decorated with this
 * validator (must be the end date) and a start date indicated by the
 * startDateProperty parameter have the max allowed number of days.
 * @param startDateProperty indicates the property that define the
 * start of a period.
 * @param maxDaysAllowed max allowed days to the period be considered valid.
 * @param propertyDisplayName user-friendly property name to be added to the
 * validation message.
 * @param validationOptions validations options.
 * @returns true if the period amount of days is inside the max allowed days.
 */
export function PeriodMaxLength(
  startDateProperty: (targetObject: unknown) => Date | string,
  maxDaysAllowed: number,
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "PeriodMaxLength",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startDateProperty, maxDaysAllowed, propertyDisplayName],
      validator: PeriodMaxLengthConstraint,
    });
  };
}
