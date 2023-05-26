import {
  DisbursementReceipt,
  DisbursementSchedule,
  InstitutionLocation,
  Student,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

/**
 * Create fake disbursement receipts.
 * @param relations dependencies.
 * - `disbursementSchedule` related disbursement schedule.
 * - `student` related student.
 * - `institutionLocation` related institution location.
 * @returns disbursement receipt.
 */
export function createFakeDisbursementReceipt(relations: {
  disbursementSchedule: DisbursementSchedule;
  student: Student;
  institutionLocation?: InstitutionLocation;
}): DisbursementReceipt {
  const now = new Date();
  const isoDateNow = getISODateOnlyString(new Date());
  const randomAmount = faker.random.number({
    min: 1000,
    max: 8999,
  });
  const receipt = new DisbursementReceipt();
  receipt.batchRunDate = isoDateNow;
  receipt.studentSIN =
    relations.student.sinValidation.sin ??
    faker.random.number({ min: 100000000, max: 899999999 }).toString();
  receipt.disbursementSchedule = relations.disbursementSchedule;
  receipt.fundingType = faker.random.alpha({ count: 2, upcase: true });
  receipt.totalEntitledDisbursedAmount = randomAmount;
  receipt.totalDisbursedAmount = randomAmount;
  receipt.disburseDate = isoDateNow;
  receipt.disburseAmountStudent = randomAmount;
  receipt.disburseAmountInstitution = randomAmount;
  receipt.dateSignedInstitution = isoDateNow;
  receipt.institutionCode =
    relations.institutionLocation.institutionCode ??
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
