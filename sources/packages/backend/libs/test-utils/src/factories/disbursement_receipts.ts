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
export function createFakeDisbursementReceipts(relations: {
  disbursementSchedule: DisbursementSchedule;
  student: Student;
  institutionLocation?: InstitutionLocation;
}): DisbursementReceipt {
  const now = new Date();
  const receipt = new DisbursementReceipt();
  receipt.batchRunDate = getISODateOnlyString(now);
  receipt.studentSIN =
    relations.student.sinValidation.sin ??
    faker.random.number({ min: 100000000, max: 899999999 }).toString();
  receipt.disbursementSchedule = relations.disbursementSchedule;
  receipt.fundingType = faker.random.alpha({ count: 2, upcase: true });
  receipt.totalEntitledDisbursedAmount = faker.random.number({
    min: 1000,
    max: 8999,
  });
  receipt.totalDisbursedAmount = faker.random.number({
    min: 1000,
    max: 8999,
  });
  receipt.disburseDate = getISODateOnlyString(now);
  receipt.disburseAmountStudent = faker.random.number({
    min: 1000,
    max: 8999,
  });
  receipt.disburseAmountInstitution = faker.random.number({
    min: 1000,
    max: 8999,
  });
  receipt.dateSignedInstitution = getISODateOnlyString(now);
  receipt.institutionCode =
    relations.institutionLocation.institutionCode ??
    faker.random.alpha({ count: 4, upcase: true });
  receipt.disburseMethodStudent = faker.random.alpha({
    count: 1,
    upcase: true,
  });
  receipt.studyPeriodEndDate = getISODateOnlyString(now);
  receipt.totalEntitledGrantAmount = receipt.totalDisbursedAmount =
    faker.random.number({
      min: 1000,
      max: 8999,
    });
  receipt.totalDisbursedGrantAmount = receipt.totalDisbursedAmount =
    faker.random.number({
      min: 1000,
      max: 8999,
    });
  receipt.totalDisbursedGrantAmountStudent = receipt.totalDisbursedAmount =
    faker.random.number({
      min: 1000,
      max: 8999,
    });
  receipt.totalDisbursedGrantAmountInstitution = receipt.totalDisbursedAmount =
    faker.random.number({
      min: 1000,
      max: 8999,
    });
  receipt.createdAt = now;
  return receipt;
}
