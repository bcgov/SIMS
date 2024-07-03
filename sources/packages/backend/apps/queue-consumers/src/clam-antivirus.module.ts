import { Module } from "@nestjs/common";
import { GlobalHttpModule } from "@sims/services";
import { ClamAVService } from "./services";

@Module({
  imports: [GlobalHttpModule],
  providers: [ClamAVService],
  exports: [ClamAVService],
})
export class ClamAntivirusModule {}
