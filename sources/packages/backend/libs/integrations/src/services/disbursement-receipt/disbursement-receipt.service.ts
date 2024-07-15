import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  RecordDataModelService,
  DisbursementReceipt,
  DisbursementReceiptValue,
  DisbursementSchedule,
  User,
} from "@sims/sims-db";
import { DisbursementReceiptModel } from "./disbursement-receipt.model";
import { getISODateOnlyString } from "@sims/utilities";
import { DisbursementReceiptHeader } from "@sims/integrations/esdc-integration";

/**
 * Code maps for the award types received in the receipt file
 * and its equivalent award code.
 */
const RECEIPT_AWARD_MAP: Record<string, string> = {
  FT: "CSGF",
  TU: "CSGT",
  FTDEP: "CSGD",
  PD: "CSGP",
};

/**
 * Service for disbursement receipts.
 */
@Injectable()
export class DisbursementReceiptService extends RecordDataModelService<DisbursementReceipt> {
  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(DisbursementReceipt));
  }

  /**
   * Insert disbursement receipt record.
   ** On insertion ignore duplicate records(identified by constraint disbursement_schedule_id_funding_type_unique).
   * @param disbursementReceipt
   * @param batchRunDate batch run date of the disbursement file.
   * @param disbursementScheduleId disbursement schedule id of corresponding document number.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param createdAt supplied from consumer as to keep the value consistent.
   * @returns generated identifier if the disbursement receipt is inserted successfully.
   */
  async insertDisbursementReceipt(
    disbursementReceipt: DisbursementReceiptModel,
    header: DisbursementReceiptHeader,
    disbursementScheduleId: number,
    auditUserId: number,
    createdAt: Date,
  ): Promise<number> {
    let generatedId: number;
    const creator = { id: auditUserId } as User;
    const disbursementReceiptEntity = new DisbursementReceipt();
    // The insert of disbursement receipt always comes from an external source through integration.
    // Hence all the date fields are parsed as date object from external source as their date format
    // may not be necessarily ISO date format.
    disbursementReceiptEntity.batchRunDate = getISODateOnlyString(
      header.batchRunDate,
    );
    disbursementReceiptEntity.fileDate = getISODateOnlyString(header.fileDate);
    disbursementReceiptEntity.sequenceNumber = header.sequenceNumber;
    disbursementReceiptEntity.studentSIN = disbursementReceipt.studentSIN;
    disbursementReceiptEntity.disbursementSchedule = {
      id: disbursementScheduleId,
    } as DisbursementSchedule;
    disbursementReceiptEntity.fundingType = disbursementReceipt.fundingType;
    disbursementReceiptEntity.totalEntitledDisbursedAmount =
      disbursementReceipt.totalEntitledDisbursedAmount;
    disbursementReceiptEntity.totalDisbursedAmount =
      disbursementReceipt.totalDisbursedAmount;
    disbursementReceiptEntity.disburseDate = getISODateOnlyString(
      disbursementReceipt.disburseDate,
    );
    disbursementReceiptEntity.disburseAmountStudent =
      disbursementReceipt.disburseAmountStudent;
    disbursementReceiptEntity.disburseAmountInstitution =
      disbursementReceipt.disburseAmountInstitution;
    disbursementReceiptEntity.dateSignedInstitution = getISODateOnlyString(
      disbursementReceipt.dateSignedInstitution,
    );
    disbursementReceiptEntity.institutionCode =
      disbursementReceipt.institutionCode;
    disbursementReceiptEntity.disburseMethodStudent =
      disbursementReceipt.disburseMethodStudent;
    disbursementReceiptEntity.studyPeriodEndDate = getISODateOnlyString(
      disbursementReceipt.studyPeriodEndDate,
    );
    disbursementReceiptEntity.totalEntitledGrantAmount =
      disbursementReceipt.totalEntitledGrantAmount;
    disbursementReceiptEntity.totalDisbursedGrantAmount =
      disbursementReceipt.totalDisbursedGrantAmount;
    disbursementReceiptEntity.totalDisbursedGrantAmountStudent =
      disbursementReceipt.totalDisbursedGrantAmountStudent;
    disbursementReceiptEntity.totalDisbursedGrantAmountInstitution =
      disbursementReceipt.totalDisbursedGrantAmountInstitution;
    disbursementReceiptEntity.creator = creator;
    disbursementReceiptEntity.createdAt = createdAt;
    disbursementReceiptEntity.disbursementReceiptValues =
      disbursementReceipt.grants.map((grant) => {
        const disbursementReceiptValue = new DisbursementReceiptValue();
        disbursementReceiptValue.grantType =
          DisbursementReceiptService.convertAwardCodeFromReceipt(
            grant.grantType,
          );
        disbursementReceiptValue.grantAmount = grant.grantAmount;
        disbursementReceiptValue.creator = creator;
        disbursementReceiptValue.createdAt = createdAt;
        return disbursementReceiptValue;
      });
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      //Query builder inserts does not cascade insert with relationships.
      //Cascaded insert can be achieved only through repository.save().
      //Hence inside a transaction we are using save to persist relations.
      const result = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(DisbursementReceipt)
        .values(disbursementReceiptEntity)
        .orIgnore(
          "ON CONSTRAINT disbursement_schedule_id_funding_type_unique DO NOTHING",
        )
        .execute();
      const [identifier] = result.identifiers;
      generatedId = identifier?.id;
      if (
        generatedId &&
        disbursementReceiptEntity.disbursementReceiptValues?.length > 0
      ) {
        await transactionalEntityManager
          .getRepository(DisbursementReceipt)
          .save({
            id: identifier.id,
            disbursementReceiptValues:
              disbursementReceiptEntity.disbursementReceiptValues,
          });
      }
    });
    return generatedId;
  }

  /**
   * Converts an award receipt code to the award
   * code understood by the system.
   * Code not part of the known map will be returned as they are.
   * @param receiptAward receipt award code (e.g. FT, TU, FTDEP, PD).
   * @returns system award code, for instance, CSGF, CSGT, CSGD, CSGP.
   */
  private static convertAwardCodeFromReceipt(receiptAward: string): string {
    return RECEIPT_AWARD_MAP[receiptAward] ?? receiptAward;
  }
}
