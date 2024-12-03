import { Module } from "@nestjs/common";
import { StudentExternalController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { StudentService } from "@sims/integrations/services";

@Module({
  imports: [AuthModule],
  controllers: [StudentExternalController],
  providers: [StudentService],
})
export class AppExternalModule {}
