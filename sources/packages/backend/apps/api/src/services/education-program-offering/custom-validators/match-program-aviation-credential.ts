import { AviationCredentialTypeOptions } from "@sims/sims-db";
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
class MatchProgramAviationCredentialConstraint
  implements ValidatorConstraintInterface
{
  validate(
    aviationCredentialType: AviationCredentialTypeOptions,
    args: ValidationArguments,
  ): boolean {
    const offeringModel = args.object as OfferingValidationModel;
    if (
      offeringModel.programContext.credentialTypesAviation?.[
        aviationCredentialType
      ]
    ) {
      return true;
    }
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    const [propertyDisplayName] = args.constraints;
    return `${propertyDisplayName} the offering aviation credential.`;
  }
}

/**
 * Executes a validation to ensure that the education program has the same
 * aviation credential as the offering.
 * @param propertyDisplayName user-friendly property name to be added to the
 * validation message.
 * @param validationOptions validation options.
 * @returns true if the education program is an aviation program,
 * otherwise, false.
 */
export function MatchProgramAviationCredential(
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "MatchProgramAviationCredential",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [propertyDisplayName],
      validator: MatchProgramAviationCredentialConstraint,
    });
  };
}
