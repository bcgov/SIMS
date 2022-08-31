import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { ProgramIntensity } from "../../../database/entities";
import { EducationProgramValidationContext } from "../education-program-offering-creation.models";

/**
 *
 */
@ValidatorConstraint()
class ProgramAllowsOfferingIntensityConstraint
  implements ValidatorConstraintInterface
{
  validate(
    offeringIntensity: ProgramIntensity,
    args: ValidationArguments,
  ): boolean {
    const program = args.object as EducationProgramValidationContext;
    if (!program?.programContext?.programIntensity) {
      throw new Error(
        "Missing the intensity information from the program associated with the offering.",
      );
    }
    return program.programContext.programIntensity.includes(offeringIntensity);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} has an offering intensity that is not allowed by its program.`;
  }
}

/**
 *
 */
export function ProgramAllowsOfferingIntensity(
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "ProgramAllowsOfferingIntensity",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: ProgramAllowsOfferingIntensityConstraint,
    });
  };
}
