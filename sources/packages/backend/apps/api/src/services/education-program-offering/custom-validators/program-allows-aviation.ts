import {
  OfferingValidationModel,
  OfferingYesNoOptions,
} from "../education-program-offering-validation.models";
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from "class-validator";

/**
 * Executes a validation to ensure that the education program is an aviation program.
 */
@ValidatorConstraint()
class ProgramAllowsAviationConstraint implements ValidatorConstraintInterface {
  validate(
    isAviationOffering: OfferingYesNoOptions,
    args: ValidationArguments,
  ): boolean {
    const offeringModel = args.object as OfferingValidationModel;
    if (isAviationOffering === OfferingYesNoOptions.No) {
      return true;
    }
    if (
      isAviationOffering === OfferingYesNoOptions.Yes &&
      offeringModel.programContext.isAviationProgram === OfferingYesNoOptions.No
    ) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const [propertyDisplayName] = args.constraints;
    return `${propertyDisplayName ?? args.property} is defined as ${
      OfferingYesNoOptions.Yes
    } but the program is not an aviation program.`;
  }
}

/**
 * Executes a validation to ensure that the education program is an aviation program.
 * @param propertyDisplayName user-friendly property name to be added to the
 * validation message.
 * @param validationOptions validation options.
 * @returns true if the education program is an aviation program,
 * otherwise, false.
 */
export function ProgramAllowsAviation(
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "ProgramAllowsAviation",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [propertyDisplayName],
      validator: ProgramAllowsAviationConstraint,
    });
  };
}
