import {
  ApplicationStatus,
  CASInvoice,
  CASInvoiceBatch,
  CASInvoiceBatchApprovalStatus,
  CASSupplier,
  DisbursementValue,
  OfferingIntensity,
  SupplierStatus,
  User,
} from "@sims/sims-db";
import * as faker from "faker";
import { saveFakeCASSupplier } from "./cas-supplier";
import {
  E2EDataSources,
  saveFakeApplicationDisbursements,
  saveFakeDisbursementReceiptsFromDisbursementSchedule,
  saveFakeInvoiceFromDisbursementReceipt,
  saveFakeStudent,
} from "..";

export function createFakeCASInvoiceBatch(
  relations: {
    creator: User;
  },
  options?: { initialValue?: Partial<CASInvoiceBatch> },
): CASInvoiceBatch {
  const now = new Date();
  const casInvoiceBatch = new CASInvoiceBatch();
  casInvoiceBatch.batchName = `SIMS-BATCH-${faker.datatype.uuid()}}`;
  casInvoiceBatch.batchDate = options?.initialValue?.batchDate ?? now;
  casInvoiceBatch.approvalStatus =
    options?.initialValue?.approvalStatus ??
    CASInvoiceBatchApprovalStatus.Pending;
  casInvoiceBatch.approvalStatusUpdatedOn =
    options?.initialValue?.approvalStatusUpdatedOn ?? now;
  casInvoiceBatch.approvalStatusUpdatedBy = relations.creator;
  casInvoiceBatch.creator = relations.creator;
  return casInvoiceBatch;
}

export async function saveFakeInvoiceIntoBatchWithInvoiceDetails(
  db: E2EDataSources,
  relations: {
    casInvoiceBatch: CASInvoiceBatch;
    creator: User;
    disbursementValues?: DisbursementValue[];
  },
  options?: {
    offeringIntensity?: OfferingIntensity;
    casSupplierInitialValues?: Partial<CASSupplier>;
  },
): Promise<CASInvoice> {
  const casSupplier = await saveFakeCASSupplier(db, undefined, {
    initialValues: options?.casSupplierInitialValues ?? {
      supplierStatus: SupplierStatus.VerifiedManually,
    },
  });
  const student = await saveFakeStudent(db.dataSource, { casSupplier });
  const application = await saveFakeApplicationDisbursements(
    db.dataSource,
    {
      student,
      disbursementValues: relations.disbursementValues,
    },
    {
      offeringIntensity: options?.offeringIntensity,
      applicationStatus: ApplicationStatus.Completed,
    },
  );
  const [firstDisbursementSchedule] =
    application.currentAssessment.disbursementSchedules;
  const { provincial: provincialDisbursementReceipt } =
    await saveFakeDisbursementReceiptsFromDisbursementSchedule(
      db,
      firstDisbursementSchedule,
    );

  // Create invoice and its details associated with th batch
  const createdInvoice = await saveFakeInvoiceFromDisbursementReceipt(db, {
    casInvoiceBatch: relations.casInvoiceBatch,
    creator: relations.creator,
    provincialDisbursementReceipt,
    casSupplier,
  });
  return createdInvoice;
}
