import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {
  OfferingActionType,
  OfferingValidationModel,
} from "../education-program-offering-validation.models";
import { RestrictionActionType } from "@sims/sims-db";

const BLOCKING_RESTRICTION_ACTION_MAP = new Map([
  [OfferingActionType.Create, RestrictionActionType.StopOfferingCreate],
]);

/**
 * Executes a validation to ensure the offering action is allowed
 * and not restricted by an effective restriction action.
 */
@ValidatorConstraint()
class IsOfferingActionAllowedConstraint implements ValidatorConstraintInterface {
  validate(actionType: OfferingActionType, args: ValidationArguments): boolean {
    const offeringModel = args.object as OfferingValidationModel;
    if (!offeringModel.effectiveRestrictionActions.length) {
      // No effective restriction actions.
      return true;
    }
    if (
      BLOCKING_RESTRICTION_ACTION_MAP.has(actionType) &&
      offeringModel.effectiveRestrictionActions.includes(
        BLOCKING_RESTRICTION_ACTION_MAP.get(actionType),
      )
    ) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const [propertyDisplayName] = args.constraints;
    if (args.value === OfferingActionType.Create) {
      return "This program is restricted and no new offerings can be created for this program.";
    }
    // Generic message for other actions.
    return `The ${propertyDisplayName ?? args.property} is not allowed due to a restriction on the program and location.`;
  }
}

/**
 * Executes a validation to ensure the offering action is allowed
 * and not restricted by an effective restriction action.
 * @param propertyDisplayName user-friendly property name.
 * @param validationOptions validation options.
 * @returns property decorator that registers the validation constraint.
 */
export function IsOfferingActionAllowed(
  propertyDisplayName?: string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string): void => {
    registerDecorator({
      name: "IsOfferingActionAllowed",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [propertyDisplayName],
      validator: IsOfferingActionAllowedConstraint,
    });
  };
}
