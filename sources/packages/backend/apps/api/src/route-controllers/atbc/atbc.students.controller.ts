import { Patch, UnprocessableEntityException } from "@nestjs/common";
import { ApiTags, ApiUnprocessableEntityResponse } from "@nestjs/swagger";
import { StudentService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { StudentUserToken } from "../../auth/userToken.interface";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { ATBCIntegrationProcessingService } from "@sims/integrations/atbc-integration";
import { DisabilityStatus } from "@sims/sims-db";
import { DISABILITY_REQUEST_NOT_ALLOWED } from "../../constants";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
//@Controller("atbc") // TODO This is commented as part of #2539 - Suspend any ATBC integration.
@ApiTags(`${ClientTypeBaseRoute.Student}-atbc`)
export class ATBCStudentController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly atbcIntegrationProcessingService: ATBCIntegrationProcessingService,
  ) {
    super();
  }

  /**
   * Creates the request for ATBC disability evaluation.
   * Student should only be allowed to check the disability status once and the
   * SIN validation must be already done with a successful result.
   */
  @Patch("apply-disability-status")
  @ApiUnprocessableEntityResponse({
    description:
      "Either the client does not have a validated SIN or the request was already sent to ATBC.",
  })
  async applyForDisabilityStatus(
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<void> {
    // Get student details
    const student = await this.studentService.getStudentById(
      studentUserToken.studentId,
    );
    // To apply for a disability status, SIN validation must be completed for the student and
    // not applied for disability status already.
    if (
      !student.sinValidation.isValidSIN ||
      student.disabilityStatus !== DisabilityStatus.NotRequested
    ) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Either SIN validation is not complete or requested for disability status already.",
          DISABILITY_REQUEST_NOT_ALLOWED,
        ),
      );
    }
    // This is the only place in application where we call an external application
    // in API instead of using queues. This is because once the student applies for PD,
    // after a successful API call the apply for PD button needs to be disabled to avoid
    // duplicate requests coming.
    await this.atbcIntegrationProcessingService.applyForDisabilityStatus(
      student.id,
    );
  }
}
