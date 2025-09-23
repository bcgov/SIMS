import { Module } from "@nestjs/common";
import {
  StudentExternalController,
  StudentExternalControllerService,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import {
  ApplicationRestrictionBypassService,
  StudentInformationService,
  StudentRestrictionService,
  StudentService,
} from "./services";
import {
  DisbursementOverawardService,
  NoteSharedService,
  RestrictionSharedService,
  SFASIndividualService,
  StudentRestrictionSharedService,
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
    StudentRestrictionSharedService,
    StudentRestrictionService,
    ApplicationRestrictionBypassService,
    RestrictionSharedService,
  ],
})
export class AppExternalModule {}
