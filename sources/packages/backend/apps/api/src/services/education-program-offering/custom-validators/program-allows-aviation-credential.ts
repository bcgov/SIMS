import { OfferingValidationModel } from "../education-program-offering-validation.models";
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from "class-validator";

/**
 * Executes a validation to ensure that the education program has the same
 * aviation credential as the offering.
 */
@ValidatorConstraint()
class ProgramAllowsAviationCredentialConstraint
  implements ValidatorConstraintInterface
{
  validate(aviationCredentialType: string, args: ValidationArguments): boolean {
    const offeringModel = args.object as OfferingValidationModel;
    const credentialTypesAviation =
      offeringModel.programContext.credentialTypesAviation;
    return !!credentialTypesAviation?.[aviationCredentialType];
  }

  defaultMessage(args: ValidationArguments) {
    const [propertyDisplayName] = args.constraints;
    return `${propertyDisplayName} for the program does not match the offering aviation credential.`;
  }
}

/**
 * Executes a validation to ensure that the education program has the same
 * aviation credential as the offering.
 * @param propertyDisplayName user-friendly property name to be added to the
 * validation message.
 * @param validationOptions validation options.
 * @returns true if the education program and offering have the same aviation
 * credential, otherwise, false.
 */
export function ProgramAllowsAviationCredential(
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "ProgramAllowsAviationCredential",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [propertyDisplayName],
      validator: ProgramAllowsAviationCredentialConstraint,
    });
  };
}
