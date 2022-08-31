import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {
  EducationProgramValidationContext,
  ProgramDeliveryOptions,
} from "../education-program-offering-validation.models";

/**
 *
 */
@ValidatorConstraint()
class ProgramAllowsOfferingDeliveryConstraint
  implements ValidatorConstraintInterface
{
  validate(
    deliveryOption: ProgramDeliveryOptions,
    args: ValidationArguments,
  ): boolean {
    const program = args.object as EducationProgramValidationContext;
    if (
      !program?.programContext?.deliveredOnSite ||
      !program?.programContext?.deliveredOnline
    ) {
      throw new Error(
        "Missing the delivery information (e.g. on-site, online) from the program associated with the offering.",
      );
    }
    switch (deliveryOption) {
      case ProgramDeliveryOptions.Onsite:
        return program.programContext.deliveredOnSite;
      case ProgramDeliveryOptions.Online:
        return program.programContext.deliveredOnline;
      case ProgramDeliveryOptions.Blended:
        // Blended requires that both options are allowed by the program.
        return (
          program.programContext.deliveredOnSite &&
          program.programContext.deliveredOnline
        );
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} has an offering intensity that is not allowed by its program.`;
  }
}

/**
 *
 */
export function ProgramAllowsOfferingDelivery(
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "ProgramAllowsOfferingDelivery",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: ProgramAllowsOfferingDeliveryConstraint,
    });
  };
}
