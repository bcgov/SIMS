import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import { AssignMSFAAJobInDTO } from "../../disbursement.dto";
import {
  ICustomHeaders,
  IOutputVariables,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";

/**
 * Create the Associate MSFAA payload expected to be received from the workflow.
 * @param options creation options.
 * - `assessmentId`: assessment to save the schedules.
 * @returns associate MSFAA payload.
 */
export function createFakeAssociateMSFAAPayload(options: {
  assessmentId: number;
}): Readonly<ZeebeJob<AssignMSFAAJobInDTO, ICustomHeaders, IOutputVariables>> {
  const variables = {
    [ASSESSMENT_ID]: options.assessmentId,
  };
  return createFakeWorkerJob<AssignMSFAAJobInDTO>({ variables });
}
