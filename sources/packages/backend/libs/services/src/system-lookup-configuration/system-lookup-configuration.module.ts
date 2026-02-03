import { Global, Module, OnModuleInit } from "@nestjs/common";
import { SystemLookupConfigurationService } from ".";
import { LoggerService } from "@sims/utilities/logger";

/**
 * System lookup configuration module.
 */
@Global()
@Module({
  providers: [SystemLookupConfigurationService],
  exports: [SystemLookupConfigurationService],
})
export class SystemLookupConfigurationModule implements OnModuleInit {
  constructor(
    private readonly systemLookupConfigurationService: SystemLookupConfigurationService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Execute module initialization actions.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log("Loading system lookup configurations.");
    await this.systemLookupConfigurationService.loadAllSystemLookupConfigurations();
  }
}
