import { Module } from "@nestjs/common";
import {
  StudentExternalController,
  StudentExternalControllerService,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { StudentInformationService, StudentService } from "./services";
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
    StudentInformationService,
    StudentExternalControllerService,
  ],
})
export class AppExternalModule {}
