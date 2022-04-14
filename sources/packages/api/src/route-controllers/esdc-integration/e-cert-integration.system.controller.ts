import { Controller, Post } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ECertFileHandler } from "../../esdc-integration/e-cert-integration/e-cert-file-handler";
import { ESDCFileResponseDTO, ESDCFileResultDTO } from "./models/esdc-model";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/e-cert")
@ApiTags("system-access")
export class ECertIntegrationController extends BaseController {
  constructor(private readonly eCertFileHandler: ECertFileHandler) {
    super();
  }

  /**
   * Process Full-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Post("process-full-time")
  async processFullTimeECertFile(): Promise<ESDCFileResultDTO> {
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
  async processFullTimeResponses(): Promise<ESDCFileResponseDTO[]> {
    const fullTimeResults =
      await this.eCertFileHandler.processFullTimeResponses();
    return fullTimeResults.map((fullTimeResult) => {
      return {
        processSummary: fullTimeResult.processSummary,
        errorsSummary: fullTimeResult.errorsSummary,
      };
    });
  }

  /**
   * Process Part-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Post("process-part-time")
  async processPartTimeECertFile(): Promise<ESDCFileResultDTO> {
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
  async processPartTimeResponses(): Promise<ESDCFileResponseDTO[]> {
    const partTimeResults =
      await this.eCertFileHandler.processPartTimeResponses();
    return partTimeResults.map((partTimeResult) => {
      return {
        processSummary: partTimeResult.processSummary,
        errorsSummary: partTimeResult.errorsSummary,
      };
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
