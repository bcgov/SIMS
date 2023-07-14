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
import { PDStatus } from "@sims/sims-db";

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
    // To apply for a PD, student must have completed the SIN validation and
    // not applied for PD already.
    if (
      !student.sinValidation.isValidSIN ||
      student.pdStatus !== PDStatus.NotRequested
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
