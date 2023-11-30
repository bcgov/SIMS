import { Global, Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";

@Global()
@Module({
  imports: [TerminusModule],
  exports: [TerminusModule],
})
export class HealthModule {}
