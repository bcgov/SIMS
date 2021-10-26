import { Injectable } from "@nestjs/common";
import { InjectLogger } from "src/common";
import { LoggerService } from "src/logger/logger.service";
import { MSFAAFileResultDto } from "src/route-controllers/msfaa-integration/models/msfaa-file-result.dto";
import { MSFAANumberService } from "..";

@Injectable()
export class MSFAAValidationService {
  constructor(private readonly msfaaNumberService: MSFAANumberService) {}

  /**
   * 1. Fetches the MSFAA number records which are not sent for validation.
   * 2.
   * @returns Processing result log.
   */
  async processMSFAAValidation(): Promise<MSFAAFileResultDto> {
    this.logger.log("Retrieving pending MSFAA validation...");
    const pendingMSFAAValidation =
      await this.msfaaNumberService.getPendingMSFAAValidation();
    if (!pendingMSFAAValidation.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }

    this.logger.log(
      `Found ${pendingMSFAAValidation.length} MSFAA number(s) that needs validation.`,
    );
  }
  @InjectLogger()
  logger: LoggerService;
}
