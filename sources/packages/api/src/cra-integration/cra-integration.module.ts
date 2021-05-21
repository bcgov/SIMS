import { Module } from "@nestjs/common";
import {
  ArchiveDbService,
  ConfigService,
  CRAIntegrationService,
  CRAPersonalVerificationService,
  SequenceControlService,
  SshService,
  StudentService,
} from "../services";

@Module({
  providers: [
    SshService,
    CRAIntegrationService,
    CRAPersonalVerificationService,
    SequenceControlService,
    StudentService,
    ArchiveDbService,
    ConfigService,
  ],
  exports: [CRAPersonalVerificationService, CRAIntegrationService],
})
export class CraIntegrationModule {}
