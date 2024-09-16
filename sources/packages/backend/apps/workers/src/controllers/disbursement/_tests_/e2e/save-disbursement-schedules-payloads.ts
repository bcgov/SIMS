import { DisbursementValueType } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import {
  DisbursementSchedule,
  DisbursementValue,
  SaveDisbursementSchedulesJobInDTO,
} from "../../disbursement.dto";
import {
  ICustomHeaders,
  IOutputVariables,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";

/**
 * Create the disbursement schedule payload expected to be received from the workflow.
 * @param options creation options.
 * - `assessmentId`: assessment to save the schedules.
 * - `createSecondDisbursement`: indicates if the second schedule should be created. Default false.
 * - `firstDisbursementAwards`: optional values to be used. If not provided, default values will be used.
 * - `secondDisbursementAwards`: optional values to be used. If not provided, default values will be used.
 * @returns disbursement schedule payload.
 */
export function createFakeSaveDisbursementSchedulesPayload(options: {
  assessmentId: number;
  createSecondDisbursement?: boolean;
  firstDisbursementAwards?: DisbursementValue[];
  secondDisbursementAwards?: DisbursementValue[];
}): Readonly<
  ZeebeJob<SaveDisbursementSchedulesJobInDTO, ICustomHeaders, IOutputVariables>
> {
  const nowString = getISODateOnlyString(new Date());
  const createSecondDisbursement = options?.createSecondDisbursement ?? false;
  const disbursementSchedules: DisbursementSchedule[] = [
    {
      disbursementDate: nowString,
      negotiatedExpiryDate: nowString,
      disbursements: options?.firstDisbursementAwards ?? [
        {
          valueCode: "CSLF",
          valueType: DisbursementValueType.CanadaLoan,
          valueAmount: 1000,
        },
        {
          valueCode: "BCSL",
          valueType: DisbursementValueType.BCLoan,
          valueAmount: 250,
        },
      ],
    },
  ];
  // Optionally creates the second disbursement.
  if (createSecondDisbursement) {
    const secondDisbursementAwards = {
      disbursementDate: nowString,
      negotiatedExpiryDate: nowString,
      disbursements: options?.secondDisbursementAwards ?? [
        {
          valueCode: "BCSL",
          valueType: DisbursementValueType.BCLoan,
          valueAmount: 350,
        },
        {
          valueCode: "CSGP",
          valueType: DisbursementValueType.CanadaGrant,
          valueAmount: 1200,
        },
      ],
    };
    disbursementSchedules.push(secondDisbursementAwards);
  }
  const variables = {
    assessmentId: options.assessmentId,
    disbursementSchedules,
  };
  return createFakeWorkerJob<SaveDisbursementSchedulesJobInDTO>({ variables });
}
