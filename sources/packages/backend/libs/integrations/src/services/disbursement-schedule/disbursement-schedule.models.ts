import { DisbursementSchedule, DisbursementValueType } from "@sims/sims-db";

export interface DisbursementValue {
  valueCode: string;
  valueType: DisbursementValueType;
  valueAmount: number;
}

export interface Disbursement {
  disbursementDate: Date;
  negotiatedExpiryDate: Date;
  disbursements: DisbursementValue[];
}

export interface ECertDisbursementSchedule extends DisbursementSchedule {
  stopFullTimeBCFunding: boolean;
}

/**
 * Full time disbursement feedback errors, there are 96 FT feedback errors.
 * Todo:  As part of this ticket plan is to keep it as a const, In future we will
 * need to save these codes (both FT and PT) in DB. We have a placeholder
 * ticket created for it.
 */
export const FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS = [
  "EDU-00010",
  "EDU-00011",
  "EDU-00012",
  "EDU-00013",
  "EDU-00014",
  "EDU-00015",
  "EDU-00016",
  "EDU-00017",
  "EDU-00018",
  "EDU-00019",
  "EDU-00020",
  "EDU-00021",
  "EDU-00022",
  "EDU-00023",
  "EDU-00024",
  "EDU-00025",
  "EDU-00026",
  "EDU-00027",
  "EDU-00028",
  "EDU-00029",
  "EDU-00030",
  "EDU-00031",
  "EDU-00032",
  "EDU-00033",
  "EDU-00034",
  "EDU-00035",
  "EDU-00036",
  "EDU-00037",
  "EDU-00038",
  "EDU-00040",
  "EDU-00041",
  "EDU-00042",
  "EDU-00043",
  "EDU-00044",
  "EDU-00045",
  "EDU-00046",
  "EDU-00047",
  "EDU-00048",
  "EDU-00049",
  "EDU-00050",
  "EDU-00051",
  "EDU-00052",
  "EDU-00053",
  "EDU-00054",
  "EDU-00055",
  "EDU-00056",
  "EDU-00057",
  "EDU-00058",
  "EDU-00059",
  "EDU-00060",
  "EDU-00061",
  "EDU-00062",
  "EDU-00064",
  "EDU-00070",
  "EDU-00071",
  "EDU-00072",
  "EDU-00073",
  "EDU-00074",
  "EDU-00075",
  "EDU-00076",
  "EDU-00078",
  "EDU-00079",
  "EDU-00080",
  "EDU-00081",
  "EDU-00082",
  "EDU-00083",
  "EDU-00084",
  "EDU-00085",
  "EDU-00086",
  "EDU-00087",
  "EDU-00088",
  "EDU-00089",
  "EDU-00090",
  "EDU-00091",
  "EDU-00092",
  "EDU-00093",
  "EDU-00094",
  "EDU-00095",
  "EDU-00096",
  "EDU-00097",
  "EDU-00098",
  "EDU-00099",
  "EDU-00100",
  "EDU-00101",
  "EDU-00102",
  "EDU-00103",
  "EDU-00104",
  "EDU-00105",
  "EDU-00106",
  "EDU-00107",
  "EDU-00108",
  "EDU-00109",
  "EDU-00110",
  "EDU-00111",
  "EDU-00112",
];
