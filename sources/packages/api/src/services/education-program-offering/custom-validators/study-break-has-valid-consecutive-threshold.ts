import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { OFFERING_VALIDATIONS_STUDY_BREAK_COMBINED_PERCENTAGE_THRESHOLD } from "../../../utilities";
import { OfferingStudyBreakCalculationContext } from "../education-program-offering-creation.models";
import { EducationProgramOfferingCreationService } from "../education-program-offering-creation.service";

/**
 *
 */
@ValidatorConstraint()
class StudyBreaksCombinedMustNotExceedsThresholdConstraint
  implements ValidatorConstraintInterface
{
  validate(_: unknown, args: ValidationArguments): boolean {
    const calculationContext =
      args.object as OfferingStudyBreakCalculationContext;
    const calculatedStudyBreaksAndWeeks =
      EducationProgramOfferingCreationService.getCalculatedStudyBreaksAndWeeks(
        calculationContext,
      );
    return calculatedStudyBreaksAndWeeks.sumOfTotalIneligibleBreakDays === 0;
  }

  defaultMessage() {
    const displayPercentage =
      OFFERING_VALIDATIONS_STUDY_BREAK_COMBINED_PERCENTAGE_THRESHOLD * 100;
    return `The combined study breaks exceed the ${displayPercentage}% threshold as outlined in StudentAid BC policy.`;
  }
}

/**
 *
 */
export function StudyBreaksCombinedMustNotExceedsThreshold(
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "StudyBreaksCombinedMustNotExceedsThreshold",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: StudyBreaksCombinedMustNotExceedsThresholdConstraint,
    });
  };
}
