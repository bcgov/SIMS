import { ValidationArguments } from "class-validator";
import { Period } from "../../../utilities";
import {
  OfferingStudyBreakCalculationContext,
  StudyBreak,
} from "../education-program-offering-validation.models";
import { EducationProgramOfferingService } from "../education-program-offering.service";

/**
 *
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

  protected getPeriodFromArguments(args: ValidationArguments): Period {
    const [startPeriodProperty, endPeriodProperty] = args.constraints;
    const startDate = startPeriodProperty(args.object);
    const endDate = endPeriodProperty(args.object);
    return { startDate, endDate };
  }
}
