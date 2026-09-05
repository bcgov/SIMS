import {
  ProgramEvaluationContext,
  ProgramEvaluationData,
  ProgramCalculatedDataKey,
} from "../education-program.service.models";

/**
 * Base evaluator for education program calculated data.
 */
export abstract class EducationProgramBaseEvaluator<T> {
  /**
   * The key representing the calculated data of the evaluator.
   */
  readonly key: ProgramCalculatedDataKey;
  /**
   * Evaluates the calculated data for the given education program data within the provided context.
   * @param data The education program data to be evaluated.
   * @param context The context in which the evaluation is performed.
   */
  abstract evaluate(
    data: Partial<ProgramEvaluationData>,
    context: ProgramEvaluationContext,
  ): T;
}
