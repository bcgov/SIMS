import { FormYesNoOptions, ProgramStatus } from "@sims/sims-db";
import { EducationProgramBaseEvaluator } from "./education-program-base-evaluator";
import {
  ProgramEvaluationData,
  ProgramEvaluationContext,
  ProgramDeliveryTypeValues,
  ProgramCourseLoadCalculationTypes,
  ProgramESLPercentage,
  ProgramCalculatedDataKey,
} from "../education-program.service.models";
import { NONE_OF_THE_ABOVE_ENTRANCE_REQUIREMENTS } from "../constants";
import { Injectable } from "@nestjs/common";
@Injectable()
export class EducationProgramStatusEvaluator extends EducationProgramBaseEvaluator<ProgramStatus> {
  /**
   * The key representing the calculated data of the evaluator.
   */
  readonly key = ProgramCalculatedDataKey.ProgramStatus;

  evaluate(
    data: Partial<ProgramEvaluationData>,
    context: ProgramEvaluationContext,
  ): ProgramStatus {
    const isWithoutAcademicCredits = this.GetIsWithoutAcademicCredits(data);
    const isBCPrivateOnlineOnly = this.GetIsBCPrivateOnlineOnly(data, context);
    const hasJointInstitution =
      data.hasJointInstitution === FormYesNoOptions.Yes;
    const isExceedingESL =
      data.eslEligibility === ProgramESLPercentage.GreaterThanEqual20;
    const hasNoEntranceRequirements = this.GetHasNoEntranceRequirements(data);
    const isLessThanMinHoursWeek = this.GetIsLessThanMinHoursWeek(data);
    const isAviationProgram = data.isAviationProgram === FormYesNoOptions.Yes;
    const isWILNotApproved = this.GetIsWILNotApproved(data);
    const isWILNotEligible = this.GetIsWILNotEligible(data);
    const isTravelNotEligible = this.GetIsTravelNotEligible(data);
    const isIntlExchangeNotEligible = this.GetIsIntlExchangeNotEligible(data);
    const isPending =
      isBCPrivateOnlineOnly ||
      hasJointInstitution ||
      isWithoutAcademicCredits ||
      isLessThanMinHoursWeek ||
      hasNoEntranceRequirements ||
      isExceedingESL ||
      isWILNotApproved ||
      isWILNotEligible ||
      isTravelNotEligible ||
      isIntlExchangeNotEligible ||
      isAviationProgram;
    return isPending ? ProgramStatus.Pending : ProgramStatus.Approved;
  }

  /**
   * Determines if the program is a BC private online-only program.
   * @param data The program data to evaluate.
   * @param context The context of the evaluation.
   * @returns True if the program is a BC private online-only program, otherwise false.
   */
  private GetIsBCPrivateOnlineOnly(
    data: Partial<ProgramEvaluationData>,
    context: ProgramEvaluationContext,
  ): boolean {
    return (
      context.isBCPrivate &&
      data.programDeliveryTypes?.includes(ProgramDeliveryTypeValues.Online) &&
      !data.programDeliveryTypes?.includes(ProgramDeliveryTypeValues.Onsite)
    );
  }

  /**
   * Determines if the program is without academic credits.
   * @param data The program data to evaluate.
   * @returns True if the program is a non-BC program without academic credits, otherwise false.
   */
  private GetIsWithoutAcademicCredits(
    data: Partial<ProgramEvaluationData>,
  ): boolean {
    return (
      data.deliveredOnlineAlsoOnsite === FormYesNoOptions.No &&
      data.sameOnlineCreditsEarned === FormYesNoOptions.No &&
      data.earnAcademicCreditsOtherInstitution === FormYesNoOptions.No
    );
  }

  /**
   * Determines if the program has less than the minimum expected hours per week.
   * @param data The program data to evaluate.
   * @returns True if the program has less than the minimum hours per week, otherwise false.
   */
  private GetIsLessThanMinHoursWeek(
    data: Partial<ProgramEvaluationData>,
  ): boolean {
    return (
      data.courseLoadCalculation === ProgramCourseLoadCalculationTypes.Hours &&
      data.minHoursWeek === FormYesNoOptions.No &&
      data.isAviationProgram === FormYesNoOptions.No
    );
  }

  /**
   * Determines if the program has no entrance requirements.
   * @param data The program data to evaluate.
   * @returns True if the program has no entrance requirements, otherwise false.
   */
  private GetHasNoEntranceRequirements(
    data: Partial<ProgramEvaluationData>,
  ): boolean {
    return data.entranceRequirements?.includes(
      NONE_OF_THE_ABOVE_ENTRANCE_REQUIREMENTS,
    );
  }

  /**
   * Determines if the program has a WIL component that is not approved.
   * @param data The program data to evaluate.
   * @returns True if the program has a WIL component that is not approved, otherwise false.
   */
  private GetIsWILNotApproved(data: Partial<ProgramEvaluationData>): boolean {
    return (
      data.hasWILComponent === FormYesNoOptions.Yes &&
      data.isWILApproved === FormYesNoOptions.No
    );
  }

  /**
   * Determines if the program has a WIL component that is not eligible.
   * @param data The program data to evaluate.
   * @returns True if the program has a WIL component that is not eligible, otherwise false.
   */
  private GetIsWILNotEligible(data: Partial<ProgramEvaluationData>): boolean {
    return (
      data.hasWILComponent === FormYesNoOptions.Yes &&
      data.isWILApproved === FormYesNoOptions.Yes &&
      data.wilProgramEligibility === FormYesNoOptions.No
    );
  }

  /**
   * Determines if the program has a travel component that is not eligible.
   * @param data The program data to evaluate.
   * @returns True if the program has a travel component that is not eligible, otherwise false.
   */
  private GetIsTravelNotEligible(
    data: Partial<ProgramEvaluationData>,
  ): boolean {
    return (
      data.hasTravel === FormYesNoOptions.Yes &&
      data.travelProgramEligibility === FormYesNoOptions.No
    );
  }

  /**
   * Determines if the program has an international exchange component that is not eligible.
   * @param data The program data to evaluate.
   * @returns True if the program has an international exchange component that is not eligible, otherwise false.
   */
  private GetIsIntlExchangeNotEligible(
    data: Partial<ProgramEvaluationData>,
  ): boolean {
    return (
      data.hasIntlExchange === FormYesNoOptions.Yes &&
      data.intlExchangeProgramEligibility === FormYesNoOptions.No
    );
  }
}
