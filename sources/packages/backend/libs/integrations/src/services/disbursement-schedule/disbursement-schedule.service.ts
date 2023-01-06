import * as dayjs from "dayjs";
import { Injectable } from "@nestjs/common";
import { StudentRestrictionSharedService } from "@sims/services";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "@sims/services/constants";
import {
  RecordDataModelService,
  DisbursementSchedule,
  OfferingIntensity,
  RestrictionActionType,
  ApplicationStatus,
  COEStatus,
  mapFromRawAndEntities,
} from "@sims/sims-db";
import { DataSource, In, Repository } from "typeorm";
import { ECertDisbursementSchedule } from "./disbursement-schedule.models";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  constructor(
    readonly dataSource: DataSource,
    private readonly studentRestrictionsService: StudentRestrictionSharedService,
  ) {
    super(dataSource.getRepository(DisbursementSchedule));
  }

  /**
   * Get DisbursementSchedule by documentNumber
   * @param documentNumber document Number
   * @returns DisbursementSchedule respective to passed documentNumber.
   */
  async getDisbursementScheduleByDocumentNumber(
    documentNumber: number,
  ): Promise<DisbursementSchedule> {
    return this.repo.findOne({ where: { documentNumber } });
  }

  /**
   * Get disbursement schedules by document numbers.
   * @param documentNumbers document numbers of disbursements.
   * @returns disbursement schedules.
   */
  async getDisbursementsByDocumentNumbers(
    documentNumbers: number[],
  ): Promise<DisbursementSchedule[]> {
    return this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.documentNumber",
      ])
      .where("disbursementSchedule.documentNumber IN (:...documentNumbers)", {
        documentNumbers,
      })
      .getMany();
  }
}
