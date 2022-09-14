import { ValidationArguments } from "class-validator";
import { Period } from "../../../utilities";
import {
  OfferingStudyBreakCalculationContext,
  StudyBreak,
} from "../education-program-offering-validation.models";
import { EducationProgramOfferingService } from "../education-program-offering.service";

/**
 * For validators that need to execute verifications of the calculated values
 * of the study breaks, this base class offers the common logic to be shared.
 */
export abstract class OfferingCalculationValidationBaseConstraint {
  protected getCalculatedStudyBreaks(
    studyBreaks: StudyBreak[],
    args: ValidationArguments,
  ) {
    const period = this.getPeriodFromArguments(args);
    const calculationContext: OfferingStudyBreakCalculationContext = {
      studyEndDate: period.endDate as string,
      studyStartDate: period.startDate as string,
      studyBreaks,
    };
    return EducationProgramOfferingService.getCalculatedStudyBreaksAndWeeks(
      calculationContext,
    );
  }

  /**
   * Converted the study start date and end dates received as parameters.
   * @param args args to have the study start date and end dates extracted.
   * @returns start date and end dates.
   */
  protected getPeriodFromArguments(args: ValidationArguments): Period {
    const [startPeriodProperty, endPeriodProperty] = args.constraints;
    const startDate = startPeriodProperty(args.object);
    const endDate = endPeriodProperty(args.object);
    return { startDate, endDate };
  }
}
