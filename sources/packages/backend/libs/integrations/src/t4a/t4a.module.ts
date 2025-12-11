import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import { T4AEnqueuerProcessingService, T4AUploadProcessingService } from ".";
import { T4AIntegrationService } from "@sims/integrations/t4a/t4a.integration.service";
import {
  SINValidationService,
  SshService,
  StudentService,
} from "@sims/integrations/services";
import { QueueModule } from "@sims/services/queue";
import { StudentFileSharedService } from "@sims/services";
import { ObjectStorageModule } from "@sims/integrations/object-storage";

@Module({
  imports: [ConfigModule, QueueModule, ObjectStorageModule],
  providers: [
    SshService,
    StudentFileSharedService,
    StudentService,
    SINValidationService,
    T4AIntegrationService,
    T4AEnqueuerProcessingService,
    T4AUploadProcessingService,
  ],
  exports: [T4AEnqueuerProcessingService, T4AUploadProcessingService],
})
export class T4AIntegrationModule {}
