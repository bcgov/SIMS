import { HttpModule } from "@nestjs/axios";
import { Global, Module } from "@nestjs/common";
import { HTTP_SERVICE_TIMEOUT } from "../utils/system-configurations-constants";

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: HTTP_SERVICE_TIMEOUT,
    }),
  ],
  exports: [HttpModule],
})
export class LoadTestHttpModule {}
