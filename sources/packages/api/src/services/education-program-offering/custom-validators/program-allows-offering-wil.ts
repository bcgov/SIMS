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
 *
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
 *
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
