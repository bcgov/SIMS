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
 * Executes a validation to ensure that the offering delivery
 * is allowed by the education program.
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
    return `${args.property} has an offering delivery that is not allowed by its program.`;
  }
}

/**
 * Executes a validation to ensure that the offering delivery
 * is allowed by the education program.
 * @param validationOptions validation options.
 * @returns true if the delivery type is allowed by the program,
 * otherwise, false.
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
