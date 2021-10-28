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

    //Create records and create file
    /*const fileContent = this.createMSFAAValidationContent(
      pendingMSFAAValidation,
    );*/
    //Create filename and generate the sequence - date specific
    //Upload result to SFTP
    //Update the dateRequested column records with date table in SIMS DB

    this.logger.log(
      `Found ${pendingMSFAAValidation.length} MSFAA number(s) that needs validation.`,
    );

    return {
      generatedFile: `present: ${pendingMSFAAValidation.length}`,
      uploadedRecords: 0,
    };
  }

  async createMSFAAValidationContent() {}
  @InjectLogger()
  logger: LoggerService;
}
