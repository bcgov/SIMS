import { Module } from "@nestjs/common";
import { StudentExternalController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { StudentService } from "./services";
import {
  DisbursementOverawardService,
  NoteSharedService,
  SFASIndividualService,
} from "@sims/services";

@Module({
  imports: [AuthModule],
  controllers: [StudentExternalController],
  providers: [
    StudentService,
    SFASIndividualService,
    DisbursementOverawardService,
    NoteSharedService,
  ],
})
export class AppExternalModule {}
