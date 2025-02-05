import {
  DisbursementReceipt,
  DisbursementReceiptValue,
  DisbursementSchedule,
  DisbursementValue,
  DisbursementValueType,
  InstitutionLocation,
  RECEIPT_FUNDING_TYPE_FEDERAL,
  RECEIPT_FUNDING_TYPE_PROVINCIAL_FULL_TIME,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";
import { createFakeDisbursementReceiptValue } from "./disbursement-receipt-value";
import { E2EDataSources } from "../data-source/e2e-data-source";

/**
 * Create fake disbursement receipts.
 * @param relations dependencies.
 * - `disbursementSchedule` related disbursement schedule.
 * - `institutionLocation` related institution location.
 * @returns disbursement receipt.
 */
export function createFakeDisbursementReceipt(relations: {
  disbursementSchedule: DisbursementSchedule;
  institutionLocation?: InstitutionLocation;
}): DisbursementReceipt {
  const student =
    relations.disbursementSchedule.studentAssessment.application.student;
  const now = new Date();
  const isoDateNow = getISODateOnlyString(new Date());
  const randomAmount = faker.datatype.number({
    min: 1000,
    max: 8999,
  });
  const receipt = new DisbursementReceipt();
  receipt.batchRunDate = isoDateNow;
  receipt.fileDate = isoDateNow;
  receipt.sequenceNumber = faker.datatype.number({
    min: 1,
    max: 99999,
  });
  receipt.studentSIN =
    student.sinValidation.sin ??
    faker.datatype.number({ min: 100000000, max: 899999999 }).toString();
  receipt.disbursementSchedule = relations.disbursementSchedule;
  receipt.fundingType = RECEIPT_FUNDING_TYPE_FEDERAL;
  receipt.totalEntitledDisbursedAmount = randomAmount;
  receipt.totalDisbursedAmount = randomAmount;
  receipt.disburseDate = isoDateNow;
  receipt.disburseAmountStudent = randomAmount;
  receipt.disburseAmountInstitution = randomAmount;
  receipt.dateSignedInstitution = isoDateNow;
  receipt.institutionCode =
    relations.institutionLocation?.institutionCode ??
    faker.random.alpha({ count: 4, upcase: true });
  receipt.disburseMethodStudent = faker.random.alpha({
    count: 1,
    upcase: true,
  });
  receipt.studyPeriodEndDate = isoDateNow;
  receipt.totalEntitledGrantAmount = randomAmount;
  receipt.totalDisbursedGrantAmount = randomAmount;
  receipt.totalDisbursedGrantAmountStudent = randomAmount;
  receipt.totalDisbursedGrantAmountInstitution = randomAmount;
  receipt.createdAt = now;
  return receipt;
}

/**
 * Create federal(FE) and provincial(BC) receipts records based in the disbursement and its awards values.
 * Each disbursement will generate two records on sims.disbursement_receipts, one for federal and another
 * for provincial awards.
 * @param dataSource application dataSource.
 * @param disbursementSchedule disbursement with the awards to have the receipts created.
 * @returns returns the federal and provincial receipt created and their awards receipts.
 */
export async function saveFakeDisbursementReceiptsFromDisbursementSchedule(
  dataSource: E2EDataSources,
  disbursementSchedule: DisbursementSchedule,
): Promise<{ federal: DisbursementReceipt; provincial: DisbursementReceipt }> {
  // Federal receipt.
  const federalDisbursementReceipt = createFakeDisbursementReceipt({
    disbursementSchedule,
  });
  federalDisbursementReceipt.fundingType = RECEIPT_FUNDING_TYPE_FEDERAL;
  // Set federal loan amount.
  federalDisbursementReceipt.totalDisbursedAmount =
    disbursementSchedule.disbursementValues.find(
      (award) => award.valueType === DisbursementValueType.CanadaLoan,
    )?.valueAmount ?? 0;
  // Provincial receipt.
  const provincialDisbursementReceipt = createFakeDisbursementReceipt({
    disbursementSchedule,
  });
  provincialDisbursementReceipt.totalDisbursedAmount =
    disbursementSchedule.disbursementValues.find(
      (award) => award.valueType === DisbursementValueType.BCLoan,
    )?.valueAmount ?? 0;
  provincialDisbursementReceipt.fundingType =
    RECEIPT_FUNDING_TYPE_PROVINCIAL_FULL_TIME;

  // Generate receipts for every federal grant part of the disbursement.
  const federalGrantsReceipts = createReceiptValuesFromDisbursementValues(
    disbursementSchedule.disbursementValues,
    DisbursementValueType.CanadaGrant,
    federalDisbursementReceipt,
  );
  // Generate receipts for every provincial grant part of the disbursement.
  // The individual BC grants are not part of the receipt, only the total amount of them.
  const provincialGrantsReceipts = createReceiptValuesFromDisbursementValues(
    disbursementSchedule.disbursementValues,
    DisbursementValueType.BCTotalGrant,
    provincialDisbursementReceipt,
  );
  // Associate the receipts with their awards values.
  federalDisbursementReceipt.disbursementReceiptValues = federalGrantsReceipts;
  provincialDisbursementReceipt.disbursementReceiptValues =
    provincialGrantsReceipts;
  const [federal, provincial] = await dataSource.disbursementReceipt.save([
    federalDisbursementReceipt,
    provincialDisbursementReceipt,
  ]);
  return {
    federal,
    provincial,
  };
}

/**
 * Create disbursement receipt values from a disbursement value list.
 * @param disbursementValues values to be filtered based on {@link awardValueType}
 * to produce a list of {@link DisbursementReceiptValue} to be saved to DB.
 * @param awardValueType filter the {@link disbursementValues} received.
 * @param disbursementReceipt related receipt.
 * @returns list of {@link DisbursementReceiptValue}.
 */
function createReceiptValuesFromDisbursementValues(
  disbursementValues: DisbursementValue[],
  awardValueType: DisbursementValueType,
  disbursementReceipt: DisbursementReceipt,
): DisbursementReceiptValue[] {
  return disbursementValues
    .filter((award) => award.valueType === awardValueType)
    .map((award) =>
      createFakeDisbursementReceiptValue(
        {
          grantType: award.valueCode,
          grantAmount: award.valueAmount,
        },
        { disbursementReceipt: disbursementReceipt },
      ),
    );
}
