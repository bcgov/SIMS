import { ProcessSummary } from "@sims/utilities/logger";
import {
  CASEvaluationResult,
  StudentSupplierToProcess,
} from "../cas-supplier.models";
import { ProcessorResult } from ".";
import { StudentProfileSnapshot } from "@sims/sims-db";

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
   * CAS API interactions.
   * @param summary current process log.
   * @returns processor result.
   */
  abstract process(
    studentSupplier: StudentSupplierToProcess,
    evaluationResult: CASEvaluationResult,
    summary: ProcessSummary,
  ): Promise<ProcessorResult>;

  /**
   * Get a snapshot of the student profile.
   * @param studentSupplier student supplier information from SIMS.
   * @returns student profile snapshot.
   */
  getStudentProfileSnapshot(
    studentSupplier: StudentSupplierToProcess,
  ): StudentProfileSnapshot {
    return {
      firstName: studentSupplier.firstName,
      lastName: studentSupplier.lastName,
      sin: studentSupplier.sin,
      addressLine1: studentSupplier.address.addressLine1,
      city: studentSupplier.address.city,
      province: studentSupplier.address.provinceState,
      postalCode: studentSupplier.address.postalCode,
      country: studentSupplier.address.country,
    };
  }
}
