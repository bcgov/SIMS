import { Module } from "@nestjs/common";
import {
  FederalRestrictionService,
  RestrictionService,
  SFASIndividualService,
  SshService,
  StudentRestrictionService,
  StudentService,
} from "../../services";
import { FedRestrictionIntegrationService } from "./fed-restriction-integration.service";
import { FedRestrictionProcessingService } from "./fed-restriction-processing.service";

@Module({
  providers: [
    SshService,
    FedRestrictionIntegrationService,
    FedRestrictionProcessingService,
    RestrictionService,
    StudentService,
    StudentRestrictionService,
    SFASIndividualService,
    FederalRestrictionService,
  ],
  exports: [FedRestrictionIntegrationService, FedRestrictionProcessingService],
})
export class FedRestrictionIntegrationModule {}
