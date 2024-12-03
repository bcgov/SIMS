import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CASSupplier, SupplierStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { Repository } from "typeorm";
import {
  CASService,
  CASSupplierResponse,
  formatAddress,
  formatPostalCode,
} from "@sims/integrations/cas";
import {
  CustomNamedError,
  isAddressFromCanada,
  processInParallel,
} from "@sims/utilities";
import { CAS_AUTH_ERROR } from "@sims/integrations/constants";
import {
  CASEvaluationResult,
  CASEvaluationStatus,
  NotFoundReason,
  PreValidationsFailedReason,
  StudentSupplierToProcess,
} from "./cas-supplier.models";
import {
  CASActiveSupplierNotFoundProcessor,
  CASPreValidationsProcessor,
  CASActiveSupplierFoundProcessor,
  CASEvaluationResultProcessor,
  CASActiveSupplierAndSiteFoundProcessor,
  ProcessorResult,
  CASKnownErrorsProcessor,
} from "./cas-evaluation-result-processor";

@Injectable()
export class CASSupplierIntegrationService {
  constructor(
    private readonly casService: CASService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
    private readonly casPreValidationsProcessor: CASPreValidationsProcessor,
    private readonly casActiveSupplierFoundProcessor: CASActiveSupplierFoundProcessor,
    private readonly casActiveSupplierNotFoundProcessor: CASActiveSupplierNotFoundProcessor,
    private readonly casActiveSupplierAndSiteFoundProcessor: CASActiveSupplierAndSiteFoundProcessor,
    private readonly casKnownErrorsProcessor: CASKnownErrorsProcessor,
  ) {}

  /**
   * CAS integration process.
   * Logs on CAS supplier API and request the supplier information for the students with pending supplier information.
   * @param parentProcessSummary parent process summary.
   * @param studentSuppliers pending CAS suppliers.
   * @returns a number of update records.
   */
  async executeCASIntegrationProcess(
    parentProcessSummary: ProcessSummary,
    studentSuppliers: StudentSupplierToProcess[],
  ): Promise<number> {
    // Force the CAS token to be acquired before starting the process.
    await this.casService.getToken();
    // Process each supplier in parallel.
    let suppliersUpdated = 0;
    const summary = new ProcessSummary();
    parentProcessSummary.children(summary);
    try {
      suppliersUpdated = await this.processSuppliers(studentSuppliers, summary);
    } catch (error: unknown) {
      if (error instanceof CustomNamedError && error.name === CAS_AUTH_ERROR) {
        summary.error(error.message);
      } else {
        summary.error("Unexpected error.", error);
      }
    }
    return suppliersUpdated;
  }

  /**
   * For each pending CAS supplier, evaluate student current data and decide
   * how to proceed to ensure student will have a supplier number and site
   * code associated.
   * @param studentSuppliers pending CAS suppliers.
   * @param parentProcessSummary parent log summary.
   * @returns number of updated suppliers.
   */
  private async processSuppliers(
    studentSuppliers: StudentSupplierToProcess[],
    parentProcessSummary: ProcessSummary,
  ): Promise<number> {
    // Process each supplier in parallel.
    const processesResults = await processInParallel(
      (studentSupplier) =>
        this.processSupplier(studentSupplier, parentProcessSummary),
      studentSuppliers,
    );
    // Get the number of updated suppliers.
    const updatedSuppliers = processesResults.filter(
      (processResult) => !!processResult?.isSupplierUpdated,
    ).length;
    return updatedSuppliers;
  }

  /**
   * Process a single student supplier.
   * This method will not throw an error if the process fails.
   * @param studentSupplier student supplier to be processed.
   * @param parentProcessSummary parent log summary.
   * @returns processor result or null if the process fails.
   */
  private async processSupplier(
    studentSupplier: StudentSupplierToProcess,
    parentProcessSummary: ProcessSummary,
  ): Promise<ProcessorResult | null> {
    const summary = new ProcessSummary();
    parentProcessSummary.children(summary);
    // Log information about the student supplier being processed.
    summary.info(
      `Processing student CAS supplier ID: ${studentSupplier.casSupplierID}.`,
    );
    try {
      const evaluationResult = await this.evaluateCASSupplier(studentSupplier);
      summary.info(`CAS evaluation result status: ${evaluationResult.status}.`);
      const processor = this.getCASSupplierProcess(evaluationResult.status);
      // Execute the process.
      const processResult = await processor.process(
        studentSupplier,
        evaluationResult,
        summary,
      );
      return processResult;
    } catch (error: unknown) {
      // Log the error and allow the process to continue checking the
      // remaining student suppliers.
      summary.error("Unexpected error while processing supplier.", error);
    }
  }

  /**
   * Get the processor associated to the CAS evaluation status result.
   * @param status evaluation result status.
   * @returns processor.
   */
  private getCASSupplierProcess(
    status: CASEvaluationStatus,
  ): CASEvaluationResultProcessor {
    switch (status) {
      case CASEvaluationStatus.PreValidationsFailed:
        return this.casPreValidationsProcessor;
      case CASEvaluationStatus.ActiveSupplierFound:
        return this.casActiveSupplierFoundProcessor;
      case CASEvaluationStatus.ActiveSupplierAndSiteFound:
        return this.casActiveSupplierAndSiteFoundProcessor;
      case CASEvaluationStatus.NotFound:
        return this.casActiveSupplierNotFoundProcessor;
      case CASEvaluationStatus.KnownErrors:
        return this.casKnownErrorsProcessor;
      default:
        throw new Error("Invalid CAS evaluation result status.");
    }
  }

  /**
   * Decide the current state of the student supplier on SIMS
   * and return the next process to be executed.
   * @param studentSupplier student CAS supplier to be evaluated.
   * @returns evaluation result to be processed next.
   */
  private async evaluateCASSupplier(
    studentSupplier: StudentSupplierToProcess,
  ): Promise<CASEvaluationResult> {
    const preValidationsFailedReasons: PreValidationsFailedReason[] = [];
    if (!studentSupplier.firstName) {
      preValidationsFailedReasons.push(
        PreValidationsFailedReason.GivenNamesNotPresent,
      );
    }
    if (!isAddressFromCanada(studentSupplier.address)) {
      preValidationsFailedReasons.push(
        PreValidationsFailedReason.NonCanadianAddress,
      );
    }
    if (preValidationsFailedReasons.length) {
      return {
        status: CASEvaluationStatus.PreValidationsFailed,
        reasons: preValidationsFailedReasons,
      };
    }
    let supplierResponse: CASSupplierResponse;
    try {
      supplierResponse = await this.casService.getSupplierInfoFromCAS(
        studentSupplier.sin,
        studentSupplier.lastName,
      );
    } catch (error: unknown) {
      return {
        status: CASEvaluationStatus.KnownErrors,
        error,
      };
    }
    if (!supplierResponse.items.length) {
      return {
        status: CASEvaluationStatus.NotFound,
        reason: NotFoundReason.SupplierNotFound,
      };
    }
    // Check if there is at least one active supplier.
    const casResponseActiveSupplier = supplierResponse.items.find(
      (supplier) => supplier.status === "ACTIVE",
    );
    if (!casResponseActiveSupplier) {
      return {
        status: CASEvaluationStatus.NotFound,
        reason: NotFoundReason.NoActiveSupplierFound,
      };
    }
    // Get a matching address, if exists.
    // Address must be active and have the same address line 1
    // and postal code considering the CAS formats.
    const casFormattedStudentAddress = formatAddress(
      studentSupplier.address.addressLine1,
    );
    const casFormattedPostalCode = formatPostalCode(
      studentSupplier.address.postalCode,
    );
    const casResponseMatchedAddress =
      casResponseActiveSupplier.supplieraddress?.find((address) => {
        return (
          address.status === "ACTIVE" &&
          address.addressline1 === casFormattedStudentAddress &&
          address.postalcode === casFormattedPostalCode
        );
      });
    if (casResponseMatchedAddress) {
      return {
        status: CASEvaluationStatus.ActiveSupplierAndSiteFound,
        activeSupplier: casResponseActiveSupplier,
        matchedAddress: casResponseMatchedAddress,
      };
    }
    return {
      status: CASEvaluationStatus.ActiveSupplierFound,
      activeSupplier: casResponseActiveSupplier,
    };
  }

  /**
   * Gets a list of CAS suppliers to be updated from CAS supplier table.
   * @returns a list of CAS suppliers to be updated.
   */
  async getStudentsToUpdateSupplierInformation(): Promise<
    StudentSupplierToProcess[]
  > {
    const pendingStudentCASSuppliers = await this.casSupplierRepo.find({
      select: {
        id: true,
        student: {
          id: true,
          sinValidation: { sin: true },
          user: { firstName: true, lastName: true },
          contactInfo: true as unknown,
        },
      },
      relations: {
        student: { sinValidation: true, user: true },
      },
      where: {
        isValid: false,
        supplierStatus: SupplierStatus.PendingSupplierVerification,
        student: { sinValidation: { isValidSIN: true } },
      },
    });
    return (
      pendingStudentCASSuppliers?.map((supplier) => ({
        sin: supplier.student.sinValidation.sin,
        firstName: supplier.student.user.firstName,
        lastName: supplier.student.user.lastName,
        email: supplier.student.user.email,
        address: supplier.student.contactInfo.address,
        casSupplierID: supplier.id,
      })) ?? []
    );
  }
}
