import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { ProgramIntensity } from "../../../database/entities";
import { SaveOfferingModel } from "../education-program-offering-validation.models";

/**
 * Executes a validation to ensure that the offering intensity
 * is allowed by the education program.
 */
@ValidatorConstraint()
class ProgramAllowsOfferingIntensityConstraint
  implements ValidatorConstraintInterface
{
  validate(
    offeringIntensity: ProgramIntensity,
    args: ValidationArguments,
  ): boolean {
    const offeringModel = args.object as SaveOfferingModel;
    if (!offeringModel?.programContext?.programIntensity) {
      return false;
    }
    return offeringModel.programContext.programIntensity.includes(
      offeringIntensity,
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} has an offering intensity that is not allowed by its program.`;
  }
}

/**
 * Executes a validation to ensure that the offering intensity
 * is allowed by the education program.
 * @param validationOptions validation options.
 * @returns true if the delivery intensity is allowed by the program,
 * otherwise, false.
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
