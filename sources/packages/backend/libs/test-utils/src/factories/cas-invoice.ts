import {
  CASInvoice,
  CASInvoiceBatch,
  CASInvoiceStatus,
  CASSupplier,
  DisbursementReceipt,
  DisbursementValueType,
  User,
} from "@sims/sims-db";
import * as faker from "faker";
import { createFakeCASInvoiceDetail } from "./cas-invoice-detail";
import { E2EDataSources } from "..";

/**
 * Creates a fake CAS invoice ready to be saved to the database.
 * @param relations relations that will be used to create the invoice.
 * - `casInvoiceBatch` invoice batch already saved to the database to be associated with the invoice.
 * - `disbursementReceipt` disbursement receipt already saved to the database to be associated with the invoice.
 * - `casSupplier` CAS supplier already saved to the database to be associated with the invoice.
 * - `creator` user already saved to the database that will be the creator of the invoice.
 * @param options optional parameters for the invoice.
 * - `initialValue` CAS invoice initial values.
 * @returns created CAS invoice.
 */
export function createFakeCASInvoice(
  relations: {
    casInvoiceBatch: CASInvoiceBatch;
    disbursementReceipt: DisbursementReceipt;
    casSupplier: CASSupplier;
    creator: User;
  },
  options?: {
    initialValue?: Partial<CASInvoice>;
  },
): CASInvoice {
  const now = new Date();
  const casInvoice = new CASInvoice();
  casInvoice.casInvoiceBatch = relations.casInvoiceBatch;
  casInvoice.disbursementReceipt = relations.disbursementReceipt;
  casInvoice.casSupplier = relations.casSupplier;
  casInvoice.invoiceNumber = faker.datatype.uuid();
  casInvoice.invoiceStatus =
    options?.initialValue?.invoiceStatus ?? CASInvoiceStatus.Pending;
  casInvoice.invoiceStatusUpdatedOn =
    options?.initialValue?.invoiceStatusUpdatedOn ?? now;
  casInvoice.creator = relations.creator;
  casInvoice.invoiceStatusUpdatedBy = relations.creator;
  return casInvoice;
}

/**
 * Saves a fake CAS invoice from a given disbursement receipt.
 * @param db The E2E data sources.
 * @param relations relations that will be used to create the invoice.
 * - `casInvoiceBatch` invoice batch already saved to the database to
 * be associated with the invoice.
 * - `creator` user already saved to the database that will be the creator
 * of the invoice and any other
 * related record.
 * - `provincialDisbursementReceipt` disbursement receipt created from the
 * E2E factory {@see saveFakeDisbursementReceiptsFromDisbursementSchedule} to ensure
 * all nested records are created.
 * - `casSupplier` CAS supplier already saved to the database to be associated
 * with the invoice.
 * @param options optional parameters to customize the invoice.
 * - `casInvoiceInitialValues` initial values for the invoice.
 * @returns invoice created from the provided {@see DisbursementReceipt}.
 */
export async function saveFakeInvoiceFromDisbursementReceipt(
  db: E2EDataSources,
  relations: {
    casInvoiceBatch: CASInvoiceBatch;
    creator: User;
    provincialDisbursementReceipt: DisbursementReceipt;
    casSupplier: CASSupplier;
  },
  options?: { casInvoiceInitialValues?: Partial<CASInvoice> },
): Promise<CASInvoice> {
  const fakeCASInvoice = createFakeCASInvoice(
    {
      casInvoiceBatch: relations.casInvoiceBatch,
      disbursementReceipt: relations.provincialDisbursementReceipt,
      casSupplier: relations.casSupplier,
      creator: relations.creator,
    },
    {
      initialValue: options?.casInvoiceInitialValues,
    },
  );
  const offeringIntensity =
    relations.provincialDisbursementReceipt.disbursementSchedule
      .studentAssessment.offering.offeringIntensity;
  // BC grants part of the award. BCSG (total grants) is not included.
  const bcAwards =
    relations.provincialDisbursementReceipt.disbursementSchedule.disbursementValues.filter(
      (disbursementValue) =>
        disbursementValue.valueType === DisbursementValueType.BCGrant,
    );
  // Get all active accounts that are supposed to be created by the DB seeding.
  const allAccounts = await db.casDistributionAccount.find({
    select: {
      id: true,
      distributionAccount: true,
      awardValueCode: true,
      offeringIntensity: true,
    },
    where: { isActive: true },
  });
  // Populate the CAS invoice details.
  fakeCASInvoice.casInvoiceDetails = [];
  bcAwards.forEach((award) => {
    const awardAccounts = allAccounts.filter(
      (account) =>
        account.awardValueCode === award.valueCode &&
        account.offeringIntensity === offeringIntensity,
    );
    const details = awardAccounts.map((account) =>
      createFakeCASInvoiceDetail(
        {
          casDistributionAccount: account,
          creator: relations.creator,
        },
        {
          initialValues: {
            valueAmount: award.effectiveAmount,
          },
        },
      ),
    );
    fakeCASInvoice.casInvoiceDetails.push(...details);
  });
  // Save invoice and its details.
  return db.casInvoice.save(fakeCASInvoice);
}
