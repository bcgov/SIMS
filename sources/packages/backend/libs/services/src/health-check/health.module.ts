import { Global, Module } from "@nestjs/common";
import { HealthService, ZeebeHealthIndicator } from ".";
import { TerminusModule } from "@nestjs/terminus";

@Global()
@Module({
  imports: [TerminusModule],
  providers: [HealthService, ZeebeHealthIndicator],
  exports: [TerminusModule, HealthService, ZeebeHealthIndicator],
})
export class HealthModule {}
