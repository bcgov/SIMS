import { Global, LoggerService, Module, OnModuleInit } from "@nestjs/common";
import {
  DynamicFormConfigurationService,
  ProgramYearService,
} from "./services";
import { InjectLogger } from "@sims/utilities/logger";
import { DynamicFormConfigurationController } from "./route-controllers";

@Global()
@Module({
  controllers: [DynamicFormConfigurationController],
  providers: [DynamicFormConfigurationService, ProgramYearService],
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
