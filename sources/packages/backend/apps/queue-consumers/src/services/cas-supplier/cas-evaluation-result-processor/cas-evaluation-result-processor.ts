import { CASSupplier } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { CASAuthDetails } from "@sims/integrations/cas";
import { CASEvaluationResult } from "../cas-supplier.models";
import { ProcessorResult } from ".";

/**
 * Process the result of a student evaluation to determine what
 * should be execute to ensure this student will have a CAS
 * supplier and a site code associated.
 */
export abstract class CASEvaluationResultProcessor {
  /**
   * When implemented in a derived class, execute the process
   * to associate a CAS supplier and a site code to a student.
   * @param casSupplier student supplier information from SIMS.
   * @param evaluationResult evaluation result to be processed.
   * @param auth authentication token needed for possible
   * CAS API interactions.
   * @param summary current process log.
   * @returns processor result.
   */
  abstract process(
    casSupplier: CASSupplier,
    evaluationResult: CASEvaluationResult,
    auth: CASAuthDetails,
    summary: ProcessSummary,
  ): Promise<ProcessorResult>;
}
