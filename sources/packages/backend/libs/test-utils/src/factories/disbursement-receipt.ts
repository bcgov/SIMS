import {
  DisbursementReceipt,
  DisbursementReceiptValue,
  DisbursementSchedule,
  DisbursementValue,
  DisbursementValueType,
  InstitutionLocation,
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
  const randomAmount = faker.random.number({
    min: 1000,
    max: 8999,
  });
  const receipt = new DisbursementReceipt();
  receipt.batchRunDate = isoDateNow;
  receipt.studentSIN =
    student.sinValidation.sin ??
    faker.random.number({ min: 100000000, max: 899999999 }).toString();
  receipt.disbursementSchedule = relations.disbursementSchedule;
  receipt.fundingType = "FE";
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
 * @param disbursementSchedule disbursement with the awards to have the receipts created.
 */
export async function saveFakeDisbursementReceiptsFromDisbursementSchedule(
  db: E2EDataSources,
  disbursementSchedule: DisbursementSchedule,
): Promise<void> {
  // Federal receipt.
  const federalDisbursementReceipt = createFakeDisbursementReceipt({
    disbursementSchedule,
  });
  federalDisbursementReceipt.fundingType = "FE";
  // Set federal loan amount.
  federalDisbursementReceipt.totalDisbursedAmount =
    disbursementSchedule.disbursementValues.find(
      (award) => award.valueType === DisbursementValueType.CanadaLoan,
    ).valueAmount;
  // Provincial receipt.
  const provincialDisbursementReceipt = createFakeDisbursementReceipt({
    disbursementSchedule,
  });
  provincialDisbursementReceipt.totalDisbursedAmount =
    disbursementSchedule.disbursementValues.find(
      (award) => award.valueType === DisbursementValueType.BCLoan,
    )?.valueAmount ?? 0;
  provincialDisbursementReceipt.fundingType = "BC";
  await db.disbursementReceipt.save([
    federalDisbursementReceipt,
    provincialDisbursementReceipt,
  ]);
  // Generate receipts for every federal grant part of the disbursement.
  const federalGrantsReceipts = createReceiptValuesFromDisbursementValues(
    disbursementSchedule.disbursementValues,
    DisbursementValueType.CanadaGrant,
    federalDisbursementReceipt,
  );
  // Generate receipts for every provincial grant part of the disbursement.
  const provincialGrantsReceipts = createReceiptValuesFromDisbursementValues(
    disbursementSchedule.disbursementValues,
    DisbursementValueType.BCGrant,
    provincialDisbursementReceipt,
  );
  await db.disbursementReceiptValue.save([
    ...federalGrantsReceipts,
    ...provincialGrantsReceipts,
  ]);
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
