import { Module } from "@nestjs/common";
import { IER12IntegrationModule } from "./institution-integration/ier-integration/ier12-integration.module";

@Module({
  imports: [IER12IntegrationModule],
})
export class IntegrationModule {}
