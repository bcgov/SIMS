import { FormYesNoOptions, ProgramStatus } from "@sims/sims-db";
import { EducationProgramBaseEvaluator } from "./education-program-base-evaluator";
import {
  ProgramEvaluationData,
  ProgramEvaluationContext,
  ProgramCourseLoadCalculationTypes,
  ProgramESLPercentage,
  ProgramCalculatedDataKey,
} from "../education-program.service.models";
import { Injectable } from "@nestjs/common";

@Injectable()
export class EducationProgramStatusEvaluator extends EducationProgramBaseEvaluator<ProgramStatus> {
  /**
   * The key representing the calculated data of the evaluator.
   */
  readonly key = ProgramCalculatedDataKey.ProgramStatus;

  /**
   * Evaluate the status of the education program based on the provided data and context.
   * @param data The program evaluation data.
   * @param context The context of the program evaluation.
   * @returns The status of the education program.
   */
  evaluate(
    data: Partial<ProgramEvaluationData>,
    context: ProgramEvaluationContext,
  ): ProgramStatus {
    // Validate the program data.
    this.validate(data);
    if (this.getIsBCPrivateOnlineOnly(data, context)) {
      return ProgramStatus.Pending;
    }
    if (data.hasJointInstitution === FormYesNoOptions.Yes) {
      return ProgramStatus.Pending;
    }
    if (data.eslEligibility === ProgramESLPercentage.GreaterThanEqual20) {
      return ProgramStatus.Pending;
    }
    if (
      data.entranceRequirements?.noneOfTheAboveEntranceRequirements === true
    ) {
      return ProgramStatus.Pending;
    }
    if (this.getIsWithoutAcademicCredits(data)) {
      return ProgramStatus.Pending;
    }
    if (this.getIsLessThanMinHoursWeek(data)) {
      return ProgramStatus.Pending;
    }
    if (data.isAviationProgram === FormYesNoOptions.Yes) {
      return ProgramStatus.Pending;
    }
    if (this.getIsWILNotApproved(data)) {
      return ProgramStatus.Pending;
    }
    if (this.getIsWILNotEligible(data)) {
      return ProgramStatus.Pending;
    }
    if (this.getIsTravelNotEligible(data)) {
      return ProgramStatus.Pending;
    }
    if (this.getIsIntlExchangeNotEligible(data)) {
      return ProgramStatus.Pending;
    }
    return ProgramStatus.Approved;
  }

  /**
   * Determines if the program is a BC private online-only program.
   * @param data The program data to evaluate.
   * @param context The context of the evaluation.
   * @returns True if the program is a BC private online-only program, otherwise false.
   */
  private getIsBCPrivateOnlineOnly(
    data: Partial<ProgramEvaluationData>,
    context: ProgramEvaluationContext,
  ): boolean {
    return (
      context.isBCPrivate &&
      data.programDeliveryTypes?.deliveredOnline &&
      !data.programDeliveryTypes?.deliveredOnSite
    );
  }

  /**
   * Determines if the program is without academic credits.
   * @param data The program data to evaluate.
   * @returns True if the program is a non-BC program without academic credits, otherwise false.
   */
  private getIsWithoutAcademicCredits(
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
  private getIsLessThanMinHoursWeek(
    data: Partial<ProgramEvaluationData>,
  ): boolean {
    return (
      data.courseLoadCalculation === ProgramCourseLoadCalculationTypes.Hours &&
      data.minHoursWeek === FormYesNoOptions.No &&
      data.isAviationProgram === FormYesNoOptions.No
    );
  }

  /**
   * Determines if the program has a WIL component that is not approved.
   * @param data The program data to evaluate.
   * @returns True if the program has a WIL component that is not approved, otherwise false.
   */
  private getIsWILNotApproved(data: Partial<ProgramEvaluationData>): boolean {
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
  private getIsWILNotEligible(data: Partial<ProgramEvaluationData>): boolean {
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
  private getIsTravelNotEligible(
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
  private getIsIntlExchangeNotEligible(
    data: Partial<ProgramEvaluationData>,
  ): boolean {
    return (
      data.hasIntlExchange === FormYesNoOptions.Yes &&
      data.intlExchangeProgramEligibility === FormYesNoOptions.No
    );
  }

  /**
   * Validate if the required minimal data is present to evaluate program status.
   * @param data The program data to validate.
   * @param context The evaluation context.
   */
  private validate(data: Partial<ProgramEvaluationData>): void {
    if (
      !data.programDeliveryTypes ||
      Object.keys(data.programDeliveryTypes).length === 0 ||
      !data.courseLoadCalculation ||
      !data.entranceRequirements ||
      Object.keys(data.entranceRequirements).length === 0 ||
      !data.eslEligibility ||
      !data.hasJointInstitution ||
      !data.hasWILComponent ||
      !data.hasTravel ||
      !data.hasIntlExchange ||
      !data.isAviationProgram
    ) {
      throw new Error("Missing required data to evaluate program status.");
    }
  }
}
