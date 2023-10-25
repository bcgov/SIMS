import { DisbursementValueType } from "@sims/sims-db";
import { IERAward } from "@sims/integrations/institution-integration/ier12-integration";

export const AWARDS_SINGLE_DISBURSEMENT: IERAward[] = [
  {
    valueType: DisbursementValueType.CanadaLoan,
    valueCode: "CSLF",
    valueAmount: 1000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGP",
    valueAmount: 2000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGD",
    valueAmount: 3000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGF",
    valueAmount: 4000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGT",
    valueAmount: 5000,
  },
  {
    valueType: DisbursementValueType.BCLoan,
    valueCode: "BCSL",
    valueAmount: 6000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "BCAG",
    valueAmount: 7000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "BGPD",
    valueAmount: 8000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "SBSD",
    valueAmount: 9000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "BCSG",
    valueAmount: 10000,
  },
];

export const AWARDS_SINGLE_DISBURSEMENT_NO_BC_FUNDING: IERAward[] = [
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGP",
    valueAmount: 2000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGD",
    valueAmount: 3000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGF",
    valueAmount: 4000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGT",
    valueAmount: 5000,
  },
];

export const AWARDS_ONE_OF_TWO_DISBURSEMENT: IERAward[] = [
  {
    valueType: DisbursementValueType.CanadaLoan,
    valueCode: "CSLF",
    valueAmount: 1000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGP",
    valueAmount: 2000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGD",
    valueAmount: 3000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGF",
    valueAmount: 4000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGT",
    valueAmount: 5000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "BCAG",
    valueAmount: 7000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "BGPD",
    valueAmount: 8000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "SBSD",
    valueAmount: 9000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "BCSG",
    valueAmount: 10000,
  },
];

export const AWARDS_TWO_OF_TWO_DISBURSEMENT: IERAward[] = [
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGP",
    valueAmount: 2000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGD",
    valueAmount: 3000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGF",
    valueAmount: 4000,
  },
  {
    valueType: DisbursementValueType.CanadaGrant,
    valueCode: "CSGT",
    valueAmount: 5000,
  },
  {
    valueType: DisbursementValueType.BCLoan,
    valueCode: "BCSL",
    valueAmount: 6000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "BCAG",
    valueAmount: 7000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "BGPD",
    valueAmount: 8000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "SBSD",
    valueAmount: 9000,
  },
  {
    valueType: DisbursementValueType.BCGrant,
    valueCode: "BCSG",
    valueAmount: 10000,
  },
];
