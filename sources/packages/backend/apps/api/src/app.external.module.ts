import { Module } from "@nestjs/common";
import { StudentExternalController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { StudentInformationService, StudentService } from "./services";
import {
  DisbursementOverawardService,
  NoteSharedService,
  SFASIndividualService,
} from "@sims/services";
import { StudentExternalControllerService } from "apps/api/src/route-controllers/student/student.external.controller.service";

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
