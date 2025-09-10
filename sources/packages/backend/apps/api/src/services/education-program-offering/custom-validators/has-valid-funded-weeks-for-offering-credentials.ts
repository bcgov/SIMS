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
 * study period amount of funded weeks for the selected offering credential.
 */
@ValidatorConstraint()
class HasValidFundedWeeksForOfferingCredentialsConstraint
  extends OfferingCalculationValidationBaseConstraint
  implements ValidatorConstraintInterface
{
  validate(studyBreaks: StudyBreak[], args: ValidationArguments): boolean {
    const offeringModel = args.object as OfferingValidationModel;
    if (offeringModel.isAviationOffering === OfferingYesNoOptions.No) {
      return true;
    }
    const calculatedStudyBreaksAndWeeks = this.getCalculatedStudyBreaks(
      studyBreaks,
      args,
    );
    const [getFundedWeeks] = args.constraints;
    const maxAllowedFundedWeeks = getFundedWeeks(
      offeringModel.aviationCredentialType,
    );
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
 * study period amount of funded weeks for the selected offering credential.
 * @param startPeriodProperty property of the model that identifies the offering start date.
 * @param endPeriodProperty property of the model that identifies the offering end date.
 * @param getFundedWeeks function that returns the number of funded weeks for the selected offering credential.
 * @param validationOptions validations options.
 * @returns true if the funded weeks for the selected aviation credential are within maximum limits, otherwise false.
 */
export function HasValidFundedWeeksForOfferingCredentials(
  startPeriodProperty: (targetObject: unknown) => Date | string,
  endPeriodProperty: (targetObject: unknown) => Date | string,
  getFundedWeeks: (targetObject: unknown) => number,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "HasValidFundedWeeksForOfferingCredentials",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startPeriodProperty, endPeriodProperty, getFundedWeeks],
      validator: HasValidFundedWeeksForOfferingCredentialsConstraint,
    });
  };
}
