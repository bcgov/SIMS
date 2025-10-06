import { Global, Inject, Module, OnModuleInit } from "@nestjs/common";
import {
  DynamicFormConfigurationService,
  ProgramYearService,
} from "./services";
import { DynamicFormConfigurationController } from "./route-controllers";
import { LoggerService } from "@sims/utilities/logger";

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

  @Inject(LoggerService)
  private logger: LoggerService;
}
