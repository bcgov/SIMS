import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {
  OfferingValidationModel,
  OfferingYesNoOptions,
  StudyBreak,
} from "../education-program-offering-validation.models";
import { OfferingCalculationValidationBaseConstraint } from "./offering-calculation-validation-base-constraint";

/**
 * For an offering that contains study breaks, execute the calculation
 * of the funded study period to validate if it matches the maximum allowed
 * study period amount of funded weeks within the maximum limit.
 */
@ValidatorConstraint()
class HasFundedWeeksWithinMaximumLimitConstraint
  extends OfferingCalculationValidationBaseConstraint
  implements ValidatorConstraintInterface
{
  validate(studyBreaks: StudyBreak[], args: ValidationArguments): boolean {
    const offeringModel = args.object as OfferingValidationModel;
    const calculatedStudyBreaksAndWeeks = this.getCalculatedStudyBreaks(
      studyBreaks,
      args,
    );
    const [, , getMaximumFundedWeeksAllowed] = args.constraints;
    const maxAllowedFundedWeeks: number | boolean | undefined =
      getMaximumFundedWeeksAllowed(
        offeringModel.isAviationOffering,
        offeringModel.aviationCredentialType,
      );
    if (typeof maxAllowedFundedWeeks === "boolean") {
      return maxAllowedFundedWeeks;
    }
    // If the maximum allowed funded weeks is not defined for a certain type,
    // then the validation should return true.
    if (!maxAllowedFundedWeeks) {
      return true;
    }
    return (
      calculatedStudyBreaksAndWeeks.totalFundedWeeks <= maxAllowedFundedWeeks
    );
  }

  defaultMessage() {
    return "The dates you have entered will create an offering with more funded weeks than allowed based on the aviation credential selected.";
  }
}

/**
 * For an offering that contains study breaks, execute the calculation
 * of the funded study period to validate if it matches the maximum allowed
 * study period amount of funded weeks within the maximum limit.
 * @param startPeriodProperty property of the model that identifies the offering start date.
 * @param endPeriodProperty property of the model that identifies the offering end date.
 * @param getMaximumFundedWeeksAllowed function that returns the maximum number of allowed
 * funded weeks within the maximum limit.
 * @param validationOptions validations options.
 * @returns true if the funded weeks for the selected aviation credential are within maximum limits, otherwise false.
 */
export function HasFundedWeeksWithinMaximumLimit(
  startPeriodProperty: (targetObject: unknown) => Date | string,
  endPeriodProperty: (targetObject: unknown) => Date | string,
  getMaximumFundedWeeksAllowed: (
    isAviationOffering: OfferingYesNoOptions,
    targetObject: unknown,
  ) => number | boolean | undefined,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "HasFundedWeeksWithinMaximumLimit",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [
        startPeriodProperty,
        endPeriodProperty,
        getMaximumFundedWeeksAllowed,
      ],
      validator: HasFundedWeeksWithinMaximumLimitConstraint,
    });
  };
}
