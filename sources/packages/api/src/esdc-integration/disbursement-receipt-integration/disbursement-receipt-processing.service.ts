import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { ConfigService, DisbursementScheduleService } from "../../services";
import { ESDCIntegrationConfig } from "../../types";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt-integration.service";

/**
 * Manages the process to import the entire snapshot of federal
 * restrictions, that is received daily, and update the students
 * restrictions, adding and deactivating accordingly.
 * * This process does not affect provincial restrictions.
 */
@Injectable()
export class DisbursementReceiptProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    private readonly connection: Connection,
    config: ConfigService,
    private readonly integrationService: DisbursementReceiptIntegrationService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
  ) {
    this.esdcConfig = config.getConfig().ESDCIntegration;
  }

  async process(): Promise<void> {
    const responseData = await this.integrationService.downloadResponseFile("");
    const documentNumbers = responseData.records.map(
      (record) => record.documentNumber,
    );
    const disbursementSchedules =
      await this.disbursementScheduleService.getDisbursementsByDocumentNumber(
        documentNumbers,
      );
    const disbursementScheduleMap = new Map<number, number>();
    disbursementSchedules.forEach((disbursementSchedule) =>
      disbursementScheduleMap.set(
        disbursementSchedule.documentNumber,
        disbursementSchedule.id,
      ),
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
