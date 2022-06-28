import { Injectable } from "@nestjs/common";
import { StringBuilder } from "../../utilities";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import {
  ConfigService,
  DisbursementReceiptService,
  ReportService,
} from "../../services";
import { ESDCFileHandler } from "../esdc-file-handler";
import {
  CreateRequestFileNameResult,
  DATE_FORMAT,
} from "../models/esdc-integration.model";
import { DailyDisbursementUploadResult } from "./models/disbursement-receipt-integration.model";
import {
  ReportFilterParam,
  ReportsFilterModel,
} from "src/services/report/report.models";

@Injectable()
export class DisbursementReceiptRequestService extends ESDCFileHandler {
  constructor(
    configService: ConfigService,
    private readonly reportService: ReportService,
    private readonly disbursementReceiptService: DisbursementReceiptService,
  ) {
    super(configService);
  }

  /**
   * 1. Fetches the Daily disbursement information which are not sent.
   * 2. Create a csv file of the total records sent on the process date.
   * 3. Upload the content to the zoneB SFTP server.
   * @returns Processing Daily Disbursement request result.
   */
  async processProvincialDailyDisbursements(
    batchRunDate?: Date,
  ): Promise<DailyDisbursementUploadResult> {
    const reportName = "Daily_Disbursement_File";
    if (batchRunDate) {
      batchRunDate =
        await this.disbursementReceiptService.getMaxDisbursementReceiptDate();
    }
    this.logger.log(
      `Fetches the Daily disbursement information which are not sent on ${batchRunDate}`,
    );

    const reportFilterModel: ReportsFilterModel = {
      reportName: reportName,
      params: { ["batchRunDate"]: batchRunDate },
    };
    const dailyDisbursementsRecordsInCSV =
      await this.reportService.getReportDataAsCSV(reportFilterModel);

    return;
  }

  /**
   * Expected file name of the request file.
   * @returns Full file path of the file to be saved on the SFTP.
   */
  async createRequestFileName(
    filenameCode: string,
  ): Promise<CreateRequestFileNameResult> {
    const fileNameArray = new StringBuilder();
    fileNameArray.append(`${this.esdcConfig.environmentCode}${filenameCode}`);
    fileNameArray.appendDate(new Date(), DATE_FORMAT);
    fileNameArray.append(".");
    const fileName = fileNameArray.toString();
    const filePath = `${this.esdcConfig.ftpRequestFolder}\\${fileName}`;
    return { fileName, filePath } as CreateRequestFileNameResult;
  }

  @InjectLogger()
  logger: LoggerService;
}
