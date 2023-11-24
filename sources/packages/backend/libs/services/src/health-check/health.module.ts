import { Global, Module } from "@nestjs/common";
import { HealthService } from ".";
import { TerminusModule } from "@nestjs/terminus";
import { ZeebeHealthIndicator } from "apps/workers/src/zeebe";

@Global()
@Module({
  imports: [TerminusModule],
  providers: [HealthService, ZeebeHealthIndicator],
  exports: [TerminusModule, HealthService, ZeebeHealthIndicator],
})
export class HealthModule {}
