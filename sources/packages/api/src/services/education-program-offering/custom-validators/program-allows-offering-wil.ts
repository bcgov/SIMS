import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {
  EducationProgramValidationContext,
  WILComponentOptions,
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
    offeringWIL: WILComponentOptions,
    args: ValidationArguments,
  ): boolean {
    const program = args.object as EducationProgramValidationContext;
    if (!program?.programContext?.hasWILComponent) {
      return false;
    }
    if (
      offeringWIL === WILComponentOptions.Yes &&
      program.programContext.hasWILComponent === WILComponentOptions.No
    ) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} is defined as ${WILComponentOptions.Yes} but the program does not allow WIL(work-integrated learning).`;
  }
}

/**
 * Executes a validation to ensure WIL(work-integrated learning)
 * option is allowed by the education program.
 * @param validationOptions validation options.
 * @returns true if the WIL(work-integrated learning) is allowed
 * by the program, otherwise, false.
 */
export function ProgramAllowsOfferingWIL(
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "ProgramAllowsOfferingWIL",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: ProgramAllowsOfferingWILConstraint,
    });
  };
}
