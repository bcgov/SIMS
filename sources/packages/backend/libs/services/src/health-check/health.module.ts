import { Global, Module } from "@nestjs/common";
import { HealthService } from ".";
import { TerminusModule } from "@nestjs/terminus";

@Global()
@Module({
  imports: [TerminusModule],
  providers: [HealthService],
  exports: [TerminusModule, HealthService],
})
export class HealthModule {}
