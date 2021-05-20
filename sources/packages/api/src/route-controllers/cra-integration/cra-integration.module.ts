import { Module } from "@nestjs/common";
import { CRAIntegrationController } from "..";
import {
  ArchiveDbService,
  ConfigService,
  CRAIntegrationService,
  CRAPersonalVerificationService,
  SshService,
  StudentService,
} from "../../services";

@Module({
  controllers: [CRAIntegrationController],
  providers: [
    SshService,
    CRAIntegrationService,
    CRAPersonalVerificationService,
    StudentService,
    ArchiveDbService,
    ConfigService,
  ],
})
export class CraIntegrationModule {}
