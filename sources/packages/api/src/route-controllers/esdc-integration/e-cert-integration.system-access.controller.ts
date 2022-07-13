import { Body, Controller, Post } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { DisbursementReceiptProcessingService } from "../../esdc-integration/disbursement-receipt-integration/disbursement-receipt-processing.service";
import { ECertFileHandler } from "../../esdc-integration/e-cert-integration/e-cert-file-handler";
import {
  DailyDisbursementReportAPIInDTO,
  ESDCFileResponseAPIOutDTO,
  ESDCFileResultAPIOutDTO,
} from "./models/esdc.dto";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { DisbursementReceiptRequestService } from "../../esdc-integration/disbursement-receipt-integration/disbursement-receipt-request.service";
import { ClientTypeBaseRoute } from "../../types";
@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("e-cert")
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-e-cert`)
export class ECertIntegrationSystemAccessController extends BaseController {
  constructor(
    private readonly eCertFileHandler: ECertFileHandler,
    private readonly disbursementReceiptProcessingService: DisbursementReceiptProcessingService,
    private readonly disbursementReceiptRequestService: DisbursementReceiptRequestService,
  ) {
    super();
  }

  /**
   * Process Full-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Post("process-full-time")
  async processFullTimeECertFile(): Promise<ESDCFileResultAPIOutDTO> {
    this.logger.log("Sending Full-Time E-Cert File...");
    const uploadFullTimeResult =
      await this.eCertFileHandler.generateFullTimeECert();
    this.logger.log("E-Cert Full-Time file sent.");
    return {
      generatedFile: uploadFullTimeResult.generatedFile,
      uploadedRecords: uploadFullTimeResult.uploadedRecords,
    };
  }

  /**
   * Download all files from FullTime E-Cert Response folder on SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  @Post("process-full-time-responses")
  async processFullTimeResponses(): Promise<ESDCFileResponseAPIOutDTO[]> {
    const fullTimeResults =
      await this.eCertFileHandler.processFullTimeResponses();
    return fullTimeResults.map((fullTimeResult) => ({
      processSummary: fullTimeResult.processSummary,
      errorsSummary: fullTimeResult.errorsSummary,
    }));
  }

  /**
   * Process Part-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Post("process-part-time")
  async processPartTimeECertFile(): Promise<ESDCFileResultAPIOutDTO> {
    this.logger.log("Sending Part-Time E-Cert File...");
    const uploadPartTimeResult =
      await this.eCertFileHandler.generatePartTimeECert();
    this.logger.log("E-Cert Part-Time file sent.");
    return {
      generatedFile: uploadPartTimeResult.generatedFile,
      uploadedRecords: uploadPartTimeResult.uploadedRecords,
    };
  }

  /**
   * Download all files from Part Time E-Cert Response folder on SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  @Post("process-part-time-responses")
  async processPartTimeResponses(): Promise<ESDCFileResponseAPIOutDTO[]> {
    const partTimeResults =
      await this.eCertFileHandler.processPartTimeResponses();
    return partTimeResults.map((partTimeResult) => ({
      processSummary: partTimeResult.processSummary,
      errorsSummary: partTimeResult.errorsSummary,
    }));
  }

  /**
   * Process all the disbursement receipt files from remote sftp location.
   * @returns Summary details of processing.
   */
  @Post("process-disbursement-receipts")
  async processDisbursementReceipts(
    @UserToken() userToken: IUserToken,
  ): Promise<ESDCFileResponseAPIOutDTO[]> {
    const processResponse =
      await this.disbursementReceiptProcessingService.process(userToken.userId);
    return processResponse.map((response) => ({
      processSummary: response.processSummary,
      errorsSummary: response.errorsSummary,
    }));
  }

  /**
   * Send provincial daily disbursement information to FIN.
   * @param payload payload.
   * @returns Summary details of processing.
   */
  @Post("process-provincial-daily-disbursements")
  async processProvincialDailyDisbursements(
    @Body() payload: DailyDisbursementReportAPIInDTO,
  ): Promise<string> {
    const batchRunDate = payload.batchRunDate
      ? new Date(payload.batchRunDate)
      : null;
    return this.disbursementReceiptRequestService.processProvincialDailyDisbursements(
      batchRunDate,
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
