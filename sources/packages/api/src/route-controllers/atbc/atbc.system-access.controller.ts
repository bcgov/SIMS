import { Controller, Patch } from "@nestjs/common";
import { ATBCService, StudentService } from "../../services";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { Student } from "../../database/entities";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("atbc")
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-atbc`)
export class ATBCSystemAccessController extends BaseController {
  constructor(
    private readonly atbcService: ATBCService,
    private readonly studentService: StudentService,
  ) {
    super();
  }

  /**
   * Get all student applied for PD in ATBC
   * Check in ATBC if PD is approved
   * update the status in SIMS DB
   */
  @Patch("pd-check")
  async PDCheck(): Promise<void> {
    this.logger.log("Get all student applied for PD in ATBC...");
    const studentAppliedPD: Student[] =
      await this.studentService.getStudentsAppliedForPD();

    // Executes the processing of each student in parallel.
    const pdProcess = studentAppliedPD.map((eachStudent) =>
      this.atbcService.PDCheckerProcess(eachStudent),
    );
    // Waits for all the parallel processes to be finished.
    await Promise.all(pdProcess);
  }

  @InjectLogger()
  logger: LoggerService;
}
