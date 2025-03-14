import {
  ApplicationStatus,
  CASInvoice,
  CASInvoiceBatch,
  CASInvoiceBatchApprovalStatus,
  CASSupplier,
  DisbursementValue,
  OfferingIntensity,
  Student,
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

/**
 * Creates a fake CAS invoice batch ready to be saved to the database.
 * @param relations relations that will be used to create the batch.
 * - `creator` user already saved to the database that will be the creator of the batch.
 * @param options options to customize the created batch.
 * - `initialValue` some fields that will be used to create the batch.
 * @returns CAS invoice batch created from the provided relations and options.
 */
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

/**
 * Creates and save a new invoice associated with the provided batch.
 * Allow the creation of a back and the creation of many invoices associated with the same batch.
 * @param db E2E data sources.
 * @param relations relations used to create the invoice.
 * - `casInvoiceBatch` invoice batch to associate with the invoice, already saved to the database.
 * - `creator` user who creates the invoice and any other related records.
 * - `disbursementValues` optional disbursement values for the invoice.
 * - `casSupplier` optional CAS supplier to create the invoice for.
 * - `student` optional student associated with the invoice.
 * @param options optional parameters to customize the invoice.
 * - `offeringIntensity` offering intensity for the invoice.
 * - `casSupplierInitialValues` initial values for the CAS supplier.
 * @returns CAS invoice created and associated with the batch.
 */
export async function saveFakeInvoiceIntoBatchWithInvoiceDetails(
  db: E2EDataSources,
  relations: {
    casInvoiceBatch: CASInvoiceBatch;
    creator: User;
    disbursementValues?: DisbursementValue[];
    casSupplier?: CASSupplier;
    student?: Student;
  },
  options?: {
    offeringIntensity?: OfferingIntensity;
    casSupplierInitialValues?: Partial<CASSupplier>;
  },
): Promise<CASInvoice> {
  // Create a valid supplier. If not valid an invoice would not be created.
  const casSupplier =
    relations.casSupplier ??
    (await saveFakeCASSupplier(db, undefined, {
      initialValues: options?.casSupplierInitialValues ?? {
        supplierStatus: SupplierStatus.VerifiedManually,
      },
    }));
  const student =
    relations.student ??
    (await saveFakeStudent(db.dataSource, { casSupplier }));
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
