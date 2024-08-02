import { Global, Module } from "@nestjs/common";
import { ObjectStorageService } from "@sims/integrations/object-storage";
import { ConfigModule } from "@sims/utilities/config";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ObjectStorageService],
  exports: [ObjectStorageService],
})
export class ObjectStorageModule {}
