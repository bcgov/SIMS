import { Module } from "@nestjs/common";
import { SystemUserModule } from "@sims/services/system-users";
import { ATBCIntegrationProcessingService } from "./atbc-integration-processing.service";
import { StudentService, ATBCService } from "../services";

@Module({
  imports: [SystemUserModule],
  providers: [ATBCIntegrationProcessingService, StudentService, ATBCService],
  exports: [ATBCIntegrationProcessingService],
})
export class ATBCIntegrationModule {}
