import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ConfigService, SshService } from "../services";

@Module({
  imports: [AuthModule],
  providers: [SshService, ConfigService],
  exports: [],
})
export class SFASIntegrationModule {}
