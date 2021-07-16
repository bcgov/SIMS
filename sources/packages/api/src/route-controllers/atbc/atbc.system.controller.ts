import {
  Controller,
  InternalServerErrorException,
  Patch,
} from "@nestjs/common";
import { ATBCService, StudentService } from "../../services";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ATBCPDCheckerPayload } from "../../types";
import { Student } from "../../database/entities";
import { ATBCPDResponseDto } from "./atbc.res.dto";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/atbc")
export class ATBCController {
  constructor(
    private readonly atbcService: ATBCService,
    private readonly studentService: StudentService,
  ) {}

  /**
   * Get all student applied for PD in ATBC
   * Check in ATBC if PD is approved
   * update the status in SIMS DB
   */
  @Patch("pd-check")
  async PDCheck(): Promise<ATBCPDResponseDto> {
    try {
      this.logger.log("Get all student applied for PD in ATBC...");
      const studentAppliedPD: Student[] =
        await this.studentService.getStudentsAppliedForPD();

      // Executes the processing of each student in parallel.
      const pdProcess = studentAppliedPD.map((eachStudent) =>
        this.atbcService.PDCheckerProcess(eachStudent),
      );
      // Waits for all the parallel processes to be finished.
      await Promise.all(pdProcess);
      return {
        message: "PD checker ran successfully",
        status: "Success",
      };
    } catch (error) {
      this.logger.log(`${error}, `);
      throw new InternalServerErrorException();
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
