import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresUserAccount,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import { StudentInformationService } from "../../services";
import {
  ActiveSINsAPIOutDTO,
  StudentSearchAPIInDTO,
  StudentSearchResultAPIOutDTO,
} from "./models/student-external-search.dto";
import { StudentExternalControllerService } from "./student.external.controller.service";
import { SFASApplication } from "@sims/sims-db";
import { LoggerService } from "@sims/utilities/logger";
import { ACTIVE_SINS_DAYS } from "../../utilities";

/**
 * Student controller for external client.
 */
@RequiresUserAccount(false)
@AllowAuthorizedParty(AuthorizedParties.external)
@Controller("student")
@ApiTags(`${ClientTypeBaseRoute.External}-student`)
export class StudentExternalController extends BaseController {
  constructor(
    private readonly studentInformationService: StudentInformationService,
    private readonly studentExternalControllerService: StudentExternalControllerService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  /**
   * Searches for student details.
   * This request method is POST to avoid passing sensitive data in the URL.
   * @param payload payload with SIN to retrieve the student details.
   * @returns student details.
   */
  @Post()
  @ApiNotFoundResponse({ description: "Student not found." })
  @HttpCode(HttpStatus.OK)
  async searchStudentDetails(
    @Body() payload: StudentSearchAPIInDTO,
  ): Promise<StudentSearchResultAPIOutDTO> {
    // Get student from SIMS.
    const student = await this.studentInformationService.getStudentBySIN(
      payload.sin,
    );
    // Get student applications from SIMS.
    const studentApplicationsPromise =
      student &&
      this.studentInformationService.getStudentApplications(student.id);
    const sfasIndividualPromise =
      this.studentInformationService.getSFASIndividualByEitherStudentOrSIN(
        payload.sin,
        student?.id,
      );
    const [studentApplications, sfasIndividual] = await Promise.all([
      studentApplicationsPromise,
      sfasIndividualPromise,
    ]);
    // Student not found in SIMS and SFAS.
    if (!student && !sfasIndividual) {
      throw new NotFoundException("Student not found.");
    }
    // Transform student details.
    const studentDetails =
      this.studentExternalControllerService.transformStudentSearchResult(
        student,
        sfasIndividual,
      );
    let legacyApplications: SFASApplication[];
    // Get legacy applications from SFAS.
    if (sfasIndividual) {
      legacyApplications =
        await this.studentInformationService.getSFASApplications(
          sfasIndividual.id,
        );
    }
    // Transform application details.
    const applications =
      this.studentExternalControllerService.transformApplicationSearchResult(
        studentApplications,
        legacyApplications,
      );
    // Log found student and SFAS individual IDs.
    if (student) {
      this.logger.log(`Found SIMS student with ID: ${student.id}`);
    }
    if (sfasIndividual) {
      this.logger.log(`Found SFAS individual with ID: ${sfasIndividual.id}`);
    }

    return {
      ...studentDetails,
      applications,
    };
  }

  /**
   * Returns all SIMS and legacy (SFAS) student SINs for full-time applications
   * meeting at least one of the following criteria:
   * - A FT application with a start date between now and the lookback/lookahead window.
   * - FT disbursements sent or issued within the lookback/lookahead window.
   * Only valid SINs are returned for SIMS students, and duplicate SINs are excluded.
   * @returns active SINs from both SIMS and SFAS.
   */
  @Get("active-sins")
  async getActiveSINs(): Promise<ActiveSINsAPIOutDTO> {
    const [simsSINs, sfasSINs] = await Promise.all([
      this.studentInformationService.getFullTimeActiveSINs(ACTIVE_SINS_DAYS),
      this.studentInformationService.getFullTimeActiveLegacySINs(
        ACTIVE_SINS_DAYS,
      ),
    ]);
    const mergedSINs = [...new Set([...simsSINs, ...sfasSINs])].sort((a, b) =>
      a.localeCompare(b),
    );
    return { sins: mergedSINs };
  }
}
