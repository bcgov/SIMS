import { Controller, Post } from "@nestjs/common";
import {
  MSFAARequestResultDto,
  ProcessResponseResDto,
} from "./models/msfaa-file-result.dto";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { OfferingIntensity } from "../../database/entities";
import { MSFAARequestService } from "../../esdc-integration/msfaa-integration/msfaa-request.service";
import { MSFAAResponseService } from "../../esdc-integration/msfaa-integration/msfaa-response.service";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/msfaa-integration")
@ApiTags("system-access")
export class MSFAAIntegrationController extends BaseController {
  constructor(
    private readonly msfaaRequestService: MSFAARequestService,
    private readonly msfaaResponseService: MSFAAResponseService,
  ) {
    super();
  }

  /**
   * Identifies all the records where the MSFAA number
   * is not requested i.e. has date_requested=null
   * Create a fixed file for part time,
   *  full time and send file to the sftp server
   * for processing
   * @returns Processing result log.
   */
  @Post("process-request")
  async processMSFAARequest(): Promise<MSFAARequestResultDto[]> {
    this.logger.log("Sending MSFAA request File...");
    const uploadFullTimeResult = this.msfaaRequestService.processMSFAARequest(
      OfferingIntensity.fullTime,
    );
    const uploadPartTimeResult = this.msfaaRequestService.processMSFAARequest(
      OfferingIntensity.partTime,
    );
    // Wait for both queries to finish.
    const [fullTimeResponse, partTimeResponse] = await Promise.all([
      uploadFullTimeResult,
      uploadPartTimeResult,
    ]);
    this.logger.log("MSFAA request file sent.");
    return [
      {
        offeringIntensity: OfferingIntensity.fullTime,
        generatedFile: fullTimeResponse.generatedFile,
        uploadedRecords: fullTimeResponse.uploadedRecords,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        generatedFile: partTimeResponse.generatedFile,
        uploadedRecords: partTimeResponse.uploadedRecords,
      },
    ];
  }

  /**
   * Download all files from MSFAA Response folder on SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  @Post("process-responses")
  async processResponses(): Promise<ProcessResponseResDto[]> {
    const results = await this.msfaaResponseService.processResponses();
    return results.map((result) => {
      return {
        processSummary: result.processSummary,
        errorsSummary: result.errorsSummary,
      };
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
