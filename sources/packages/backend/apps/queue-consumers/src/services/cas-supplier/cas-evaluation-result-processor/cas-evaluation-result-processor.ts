import { CASSupplier } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { CASEvaluationResult } from "../cas-supplier.models";
import { CASAuthDetails } from "@sims/integrations/cas";

export abstract class CASEvaluationResultProcessor {
  abstract process(
    casSupplier: CASSupplier,
    evaluationResult: CASEvaluationResult,
    auth: CASAuthDetails,
    summary: ProcessSummary,
  ): Promise<boolean>;
}
