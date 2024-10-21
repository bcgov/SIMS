import { ProcessSummary } from "@sims/utilities/logger";
import { CASAuthDetails } from "@sims/integrations/cas";
import {
  CASEvaluationResult,
  StudentSupplierToProcess,
} from "../cas-supplier.models";
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
   * @param studentSupplier student supplier information from SIMS.
   * @param evaluationResult evaluation result to be processed.
   * @param auth authentication token needed for possible
   * CAS API interactions.
   * @param summary current process log.
   * @returns processor result.
   */
  abstract process(
    studentSupplier: StudentSupplierToProcess,
    evaluationResult: CASEvaluationResult,
    auth: CASAuthDetails,
    summary: ProcessSummary,
  ): Promise<ProcessorResult>;
}
