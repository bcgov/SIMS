import {
  Controller,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApiTags, ApiUnprocessableEntityResponse } from "@nestjs/swagger";
import { StudentService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { StudentUserToken } from "../../auth/userToken.interface";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { ATBCIntegrationProcessingService } from "@sims/integrations/atbc-integration";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("atbc")
@ApiTags(`${ClientTypeBaseRoute.Student}-atbc`)
export class ATBCStudentController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly atbcIntegrationProcessingService: ATBCIntegrationProcessingService,
  ) {
    super();
  }

  /**
   * Creates the request for ATBC PD evaluation.
   * Student should only be allowed to check the PD status once and the
   * SIN validation must be already done with a successful result.
   */
  @Patch("apply-pd-status")
  @ApiUnprocessableEntityResponse({
    description:
      "Either the client does not have a validated SIN or the request was already sent to ATBC.",
  })
  async applyForPDStatus(
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<void> {
    // Get student details
    const student = await this.studentService.getStudentById(
      studentUserToken.studentId,
    );
    // Check the PD status in DB. Student should only be allowed to check the PD status once.
    // studentPDSentAt is set when student apply for PD status for the first.
    // studentPDVerified is null before PD scheduled job update status.
    // studentPDVerified is true if PD confirmed by ATBC or is true from sfas_individual table.
    // studentPDVerified is false if PD denied by ATBC.
    if (
      !student.sinValidation.isValidSIN ||
      !!student.studentPDSentAt ||
      student.studentPDVerified !== null
    ) {
      throw new UnprocessableEntityException(
        "Either the client does not have a validated SIN or the request was already sent to ATBC.",
      );
    }
    // This is the only place in application where we call an external application
    // in API instead of using queues. This is because once the student applies for PD,
    // after a successful API call the apply for PD button needs to be disabled to avoid
    // duplicate requests coming.
    await this.atbcIntegrationProcessingService.applyForPDStatus(student.id);
  }
}
