import { HttpModule } from "@nestjs/axios";
import { Global, Module } from "@nestjs/common";

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
    }),
  ],
  exports: [HttpModule],
})
export class GlobalHttpModule {}
