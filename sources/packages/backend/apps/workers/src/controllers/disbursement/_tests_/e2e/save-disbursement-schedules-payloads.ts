import { DisbursementValueType } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import { SaveDisbursementSchedulesJobInDTO } from "../../disbursement.dto";
import {
  ICustomHeaders,
  IOutputVariables,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";

export function createFakeSaveDisbursementSchedulesPayload(
  assessmentId: number,
): Readonly<
  ZeebeJob<SaveDisbursementSchedulesJobInDTO, ICustomHeaders, IOutputVariables>
> {
  const nowString = getISODateOnlyString(new Date());
  const disbursementSchedules = [
    {
      disbursementDate: nowString,
      negotiatedExpiryDate: nowString,
      disbursements: [
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
    {
      disbursementDate: nowString,
      negotiatedExpiryDate: nowString,
      disbursements: [
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
    },
  ];

  const variables = {
    assessmentId,
    disbursementSchedules,
  };
  return createFakeWorkerJob<SaveDisbursementSchedulesJobInDTO>({ variables });
}
