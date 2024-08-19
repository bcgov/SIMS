import { Injectable } from "@nestjs/common";
import { ApplicationService } from "@sims/integrations/services";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { ProcessSummary } from "@sims/utilities/logger";
import { DataSource } from "typeorm";

@Injectable()
export class ApplicationChangesReportProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationService: ApplicationService,
    config: ConfigService,
  ) {
    this.esdcConfig = config.esdcIntegration;
  }

  async generateApplicationChangesReport(
    processSummary: ProcessSummary,
  ): Promise<void> {
    processSummary.info(
      "Retrieving all application changes which were not reported already.",
    );
    const applicationChanges =
      await this.applicationService.getDateChangeNotReportedApplication();
    console.log(applicationChanges);
    processSummary.info(
      `Found ${applicationChanges.length} application changes.`,
    );
  }
}
