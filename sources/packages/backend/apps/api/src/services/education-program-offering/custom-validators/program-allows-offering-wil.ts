import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {
  OfferingValidationModel,
  OfferingYesNoOptions,
} from "../education-program-offering-validation.models";

/**
 * Executes a validation to ensure WIL(work-integrated learning)
 * option is allowed by the education program.
 */
@ValidatorConstraint()
class ProgramAllowsOfferingWILConstraint
  implements ValidatorConstraintInterface
{
  validate(
    offeringWIL: OfferingYesNoOptions,
    args: ValidationArguments,
  ): boolean {
    const offeringModel = args.object as OfferingValidationModel;
    if (!offeringModel?.programContext?.hasWILComponent) {
      return false;
    }
    if (
      offeringWIL === OfferingYesNoOptions.Yes &&
      offeringModel.programContext.hasWILComponent === OfferingYesNoOptions.No
    ) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const [propertyDisplayName] = args.constraints;
    return `${propertyDisplayName ?? args.property} is defined as ${
      OfferingYesNoOptions.Yes
    } but the program does not allow WIL(work-integrated learning).`;
  }
}

/**
 * Executes a validation to ensure WIL(work-integrated learning)
 * option is allowed by the education program.
 * @param propertyDisplayName user-friendly property name to be added to the
 * validation message.
 * @param validationOptions validation options.
 * @returns true if the WIL(work-integrated learning) is allowed
 * by the program, otherwise, false.
 */
export function ProgramAllowsOfferingWIL(
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "ProgramAllowsOfferingWIL",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [propertyDisplayName],
      validator: ProgramAllowsOfferingWILConstraint,
    });
  };
}
