import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {
  OfferingDeliveryOptions,
  OfferingValidationModel,
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
    const offeringModel = args.object as OfferingValidationModel;
    if (!offeringModel?.programContext) {
      return false;
    }
    switch (deliveryOption) {
      case OfferingDeliveryOptions.Onsite:
        return offeringModel.programContext.deliveredOnSite;
      case OfferingDeliveryOptions.Online:
        return offeringModel.programContext.deliveredOnline;
      case OfferingDeliveryOptions.Blended:
        // Blended requires that both options are allowed by the program.
        return (
          offeringModel.programContext.deliveredOnSite &&
          offeringModel.programContext.deliveredOnline
        );
    }
  }

  defaultMessage(args: ValidationArguments) {
    const [propertyDisplayName] = args.constraints;
    return `${
      propertyDisplayName ?? args.property
    } has an offering delivery that is not allowed by its program.`;
  }
}

/**
 * Executes a validation to ensure that the offering delivery
 * is allowed by the education program.
 * @param propertyDisplayName user-friendly property name to be added to the
 * validation message.
 * @param validationOptions validation options.
 * @returns true if the delivery type is allowed by the program,
 * otherwise, false.
 */
export function ProgramAllowsOfferingDelivery(
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "ProgramAllowsOfferingDelivery",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [propertyDisplayName],
      validator: ProgramAllowsOfferingDeliveryConstraint,
    });
  };
}
