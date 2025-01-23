import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  CASDistributionAccount,
  CASInvoiceBatch,
  DisbursementReceiptValue,
} from "@sims/sims-db";
import { Repository } from "typeorm";

Injectable();
export class CASInvoiceBatchService {
  constructor(
    @InjectRepository(CASInvoiceBatch)
    private readonly casInvoiceBatchRepo: Repository<CASInvoiceBatch>,
    @InjectRepository(DisbursementReceiptValue)
    private readonly disbursementReceiptValueRepo: Repository<DisbursementReceiptValue>,
  ) {}

  async getCASInvoiceBatches(): Promise<CASInvoiceBatch[]> {
    return this.casInvoiceBatchRepo.find({
      select: {
        id: true,
        batchName: true,
        batchDate: true,
        approvalStatus: true,
        approvalStatusUpdatedOn: true,
        approvalStatusUpdatedBy: { id: true, firstName: true, lastName: true },
      },
      relations: {
        approvalStatusUpdatedBy: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async createInvoiceBatch(): Promise<CASInvoiceBatch> {
    const newBatch = this.casInvoiceBatchRepo
      .createQueryBuilder("disbursementReceiptValue")
      .select([
        "disbursementReceipt.id",
        "disbursementSchedule.id",
        "casDistributionAccount.id",
        "casDistributionAccount.operationCode",
        "casDistributionAccount.distributionAccount",
        "disbursementValues.valueAmount",
      ])
      .innerJoin(
        "disbursementReceiptValue.disbursementReceipt",
        "disbursementReceipt",
      )
      .innerJoin(
        "disbursementReceipt.disbursementSchedule",
        "disbursementSchedule",
      )
      .innerJoin(
        "disbursementSchedule.disbursementValues",
        "disbursementValues",
      )
      .innerJoin(
        CASDistributionAccount,
        "casDistributionAccount",
        "casDistributionAccount.awardValueCode = disbursementValues.valueCode",
      )
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.casSupplier", "casSupplier")
      .where("disbursementReceiptValue.grantType = :grantType", {
        grantType: "BCSG",
      })
      .andWhere("disbursementReceiptValue.grantAmount > 0")
      .andWhere("disbursementValues.valueType = :valueType", {
        valueType: "BC Grant",
      })
      .andWhere("disbursementValues.effectiveAmount > 0")
      .andWhere("casDistributionAccount.isActive = true")
      .andWhere("casSupplier.isValid = true")
      // TODO: add exists
      // and not exists (
      //   select
      //     1
      //  from
      //    sims.cas_invoices cas_invoices
      //  where
      //    cas_invoices.disbursement_receipt_id = disbursement_receipts.id
      // )
      .getMany();

    return null;
  }
}
