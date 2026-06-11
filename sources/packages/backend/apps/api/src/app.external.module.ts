import { Module } from "@nestjs/common";
import {
  DisabilityProfileExternalController,
  StudentExternalController,
  StudentExternalControllerService,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import {
  ApplicationRestrictionBypassService,
  DisabilityProfileService,
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
  controllers: [StudentExternalController, DisabilityProfileExternalController],
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
    DisabilityProfileService,
  ],
})
export class AppExternalModule {}
