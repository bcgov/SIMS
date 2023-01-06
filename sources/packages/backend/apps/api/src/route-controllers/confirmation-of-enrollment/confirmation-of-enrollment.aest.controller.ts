import { Controller, Param, ParseIntPipe, Patch } from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { Role } from "../../auth/roles.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { IUserToken } from "../../auth/userToken.interface";
import { COE_NOT_FOUND_MESSAGE } from "../../constants";
import { ClientTypeBaseRoute } from "../../types";
import { COE_WINDOW } from "../../utilities";
import BaseController from "../BaseController";
import { ConfirmationOfEnrollmentControllerService } from "./confirmation-of-enrollment.controller.service";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("confirmation-of-enrollment")
@ApiTags(`${ClientTypeBaseRoute.AEST}[Confirmation Of Enrollment - CoE]`)
export class ConfirmationOfEnrollmentAESTController extends BaseController {
  constructor(
    private readonly confirmationOfEnrollmentControllerService: ConfirmationOfEnrollmentControllerService,
  ) {
    super();
  }

  /**
   * Approve confirmation of enrollment(COE).
   * An application can have up to two COEs based on the disbursement schedule,
   * hence the COE approval happens twice for application with more than once disbursement.
   * Irrespective of number of COEs to be approved, application status is set to complete
   * on first COE approval.
   * @param disbursementScheduleId disbursement schedule id of COE.
   */
  @ApiNotFoundResponse({ description: COE_NOT_FOUND_MESSAGE })
  @ApiUnprocessableEntityResponse({
    description:
      `Confirmation of enrollment window is greater than ${COE_WINDOW} days ` +
      "or the first disbursement(COE) is not completed and it must be completed.",
  })
  @Roles(Role.StudentConfirmEnrolment)
  @Patch("disbursement-schedule/:disbursementScheduleId/confirm")
  async confirmEnrollment(
    @Param("disbursementScheduleId", ParseIntPipe)
    disbursementScheduleId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    // Ministry must be able to confirm enrolment(s) even outside the valid COE window.
    await this.confirmationOfEnrollmentControllerService.confirmEnrollment(
      disbursementScheduleId,
      userToken.userId,
      { allowOutsideCOEWindow: true },
    );
  }
}
