import {
  EvaluationProgramContext,
  EvaluationProgramData,
} from "../education-program.service.models";

/**
 * Base evaluator for education program calculated data.
 */
export abstract class EducationProgramBaseEvaluator<T> {
  /**
   * Evaluates the specified calculated data keys for the given education program data within the provided context.
   * @param calculatedDataKeys The keys of the calculated data to evaluate.
   * @param data The education program data to be evaluated.
   * @param context The context in which the evaluation is performed.
   */
  abstract evaluate(
    data: Partial<EvaluationProgramData>,
    context: EvaluationProgramContext,
  ): T;
}
