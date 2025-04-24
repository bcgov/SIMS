import { Global, Module } from "@nestjs/common";
import { DynamicFormConfigurationService } from "./services";

@Global()
@Module({
  providers: [DynamicFormConfigurationService],
  exports: [DynamicFormConfigurationService],
})
export class DynamicFormConfigurationModule {}
