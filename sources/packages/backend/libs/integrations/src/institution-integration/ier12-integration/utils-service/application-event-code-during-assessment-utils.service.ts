import { Injectable } from "@nestjs/common";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { ApplicationSharedService } from "@sims/services";
import { ApplicationEventCode } from "../models/ier12-integration.model";

@Injectable()
export class ApplicationEventCodeDuringAssessmentUtilsService {
  constructor(
    private readonly applicationSharedService: ApplicationSharedService,
  ) {}

  /**
   * Get application event code for an application with assessment status.
   * @param applicationNumber application number.
   * @returns application event code.
   */
  async applicationEventCodeDuringAssessment(
    applicationNumber: string,
  ): Promise<ApplicationEventCode.REIA | ApplicationEventCode.ASMT> {
    // Check if the application has more than one submissions.
    const hasMultipleApplicationSubmissions =
      await this.applicationSharedService.hasMultipleApplicationSubmissions(
        applicationNumber,
      );
    return hasMultipleApplicationSubmissions
      ? ApplicationEventCode.REIA
      : ApplicationEventCode.ASMT;
  }

  @InjectLogger()
  logger: LoggerService;
}
