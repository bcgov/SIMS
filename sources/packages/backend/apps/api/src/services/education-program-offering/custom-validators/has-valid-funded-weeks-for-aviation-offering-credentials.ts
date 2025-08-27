import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {
  AviationCredentialTypeOptions,
  AviationYesNoOptions,
  MaximumFundedWeeksForAviationOfferingCredentials,
  OfferingValidationModel,
  StudyBreak,
} from "../education-program-offering-validation.models";
import { OfferingCalculationValidationBaseConstraint } from "./offering-calculation-validation-base-constraint";

/**
 * For an offering that contains study breaks and is an aviation offering,
 * execute the calculation of the funded study period to validate if it matches
 * the maximum allowed study period amount of funded weeks for the selected
 * aviation offering credential.
 */
@ValidatorConstraint()
class HasValidFundedWeeksForAviationOfferingCredentialsConstraint
  extends OfferingCalculationValidationBaseConstraint
  implements ValidatorConstraintInterface
{
  validate(studyBreaks: StudyBreak[], args: ValidationArguments): boolean {
    const offeringModel = args.object as OfferingValidationModel;
    if (offeringModel.isAviationOffering === AviationYesNoOptions.No) {
      return true;
    }
    const calculatedStudyBreaksAndWeeks = this.getCalculatedStudyBreaks(
      studyBreaks,
      args,
    );
    switch (offeringModel.aviationCredentialType) {
      case AviationCredentialTypeOptions.CommercialPilotTraining:
        return (
          calculatedStudyBreaksAndWeeks.totalFundedWeeks <=
          MaximumFundedWeeksForAviationOfferingCredentials.CommercialPilotTraining
        );
      case AviationCredentialTypeOptions.InstructorsRating:
      case AviationCredentialTypeOptions.Endorsements:
        return (
          calculatedStudyBreaksAndWeeks.totalFundedWeeks <=
          MaximumFundedWeeksForAviationOfferingCredentials.InstructorsRatingAndEndorsements
        );
      default:
        return true;
    }
  }

  defaultMessage() {
    return "The dates you have entered will create an offering with more funded weeks than allowed based on the aviation credential selected.";
  }
}

/**
 * For an offering that contains study breaks and is an aviation offering,
 * execute the calculation of the funded study period to validate if it matches
 * the maximum allowed study period amount of funded weeks for the selected
 * aviation offering credential.
 * @param startPeriodProperty property of the model that identifies the offering start date.
 * @param endPeriodProperty property of the model that identifies the offering end date.
 * @param validationOptions validations options.
 * @returns true if the funded weeks for the selected aviation credential are within maximum limits, otherwise false.
 */
export function HasValidFundedWeeksForAviationOfferingCredentials(
  startPeriodProperty: (targetObject: unknown) => Date | string,
  endPeriodProperty: (targetObject: unknown) => Date | string,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "HasValidFundedWeeksForAviationOfferingCredentials",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startPeriodProperty, endPeriodProperty],
      validator: HasValidFundedWeeksForAviationOfferingCredentialsConstraint,
    });
  };
}
