import { DisbursementValueType } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { DisbursementSaveModel } from "../disbursement-schedule.models";

export function createFakeDisbursementPayload(): DisbursementSaveModel[] {
  const nowString = getISODateOnlyString(new Date());
  return [
    {
      disbursementDate: nowString,
      negotiatedExpiryDate: nowString,
      disbursements: [
        {
          valueCode: "CSLF",
          valueType: DisbursementValueType.CanadaLoan,
          valueAmount: 1200,
        },
        {
          valueCode: "BCSL",
          valueType: DisbursementValueType.BCLoan,
          valueAmount: 300,
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
          valueAmount: 300,
        },
      ],
    },
  ];
}
