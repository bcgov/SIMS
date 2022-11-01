import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { ConfigService, StudentAssessmentService } from "../../services";
import { IERIntegrationConfig } from "../../types";
import { IERUploadResult } from "./models/ier-integration.model";

@Injectable()
export class IERRequestService {
  ierIntegrationConfig: IERIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    this.ierIntegrationConfig = config.getConfig().IERIntegrationConfig;
  }

  /**
   * 1. Fetches the assessment data for the institution location.
   * 2. Create the Request content for the IER 12 file by populating the
   * header, footer and trailer content.
   * 3. Create the request filename with the file path with respect to the institution code
   * for the IER 12 Request sent File.
   * 4. Upload the content to the zoneB SFTP server.
   * @param generatedDate date in which the assessment for
   * particular institution is generated.
   * @returns Processing IER 12 request result.
   */
  async processIER12Request(generatedDate?: Date): Promise<IERUploadResult> {
    this.logger.log(
      `Retrieving pending assessment on ${generatedDate} for IER 12 request...`,
    );
    const assessmentRequests =
      await this.studentAssessmentService.getPendingAssessment(generatedDate);
    if (!assessmentRequests.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }
    this.logger.log(`Found ${assessmentRequests.length} assessments.`);
  }

  @InjectLogger()
  logger: LoggerService;
}
