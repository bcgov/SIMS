import { Global, LoggerService, Module, OnModuleInit } from "@nestjs/common";
import { DynamicFormConfigurationService } from "./services";
import { InjectLogger } from "@sims/utilities/logger";

@Global()
@Module({
  providers: [DynamicFormConfigurationService],
  exports: [DynamicFormConfigurationService],
})
export class DynamicFormConfigurationModule implements OnModuleInit {
  constructor(
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
  ) {}

  /**
   * Execute module initialization actions.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log("Loading dynamic form configurations.");
    await this.dynamicFormConfigurationService.loadAllDynamicFormConfigurations();
  }

  @InjectLogger()
  logger: LoggerService;
}
