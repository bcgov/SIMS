import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {
  EducationProgramValidationContext,
  OfferingDeliveryOptions,
} from "../education-program-offering-validation.models";

/**
 *
 */
@ValidatorConstraint()
class ProgramAllowsOfferingDeliveryConstraint
  implements ValidatorConstraintInterface
{
  validate(
    deliveryOption: OfferingDeliveryOptions,
    args: ValidationArguments,
  ): boolean {
    const program = args.object as EducationProgramValidationContext;
    if (
      !program?.programContext?.deliveredOnSite ||
      !program?.programContext?.deliveredOnline
    ) {
      return false;
    }
    switch (deliveryOption) {
      case OfferingDeliveryOptions.Onsite:
        return program.programContext.deliveredOnSite;
      case OfferingDeliveryOptions.Online:
        return program.programContext.deliveredOnline;
      case OfferingDeliveryOptions.Blended:
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
