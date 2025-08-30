import { Body, Controller, Param, ParseIntPipe, Patch } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties, IUserToken, Role, UserGroups } from "../../auth";
import { CancelDisbursementScheduleAPIInDTO } from "../../route-controllers";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("disbursement-schedule")
@ApiTags(`${ClientTypeBaseRoute.AEST}-disbursement-schedule`)
export class DisbursementScheduleAESTController extends BaseController {
  /**
   * Cancels a disbursement schedule.
   * @param disbursementScheduleId disbursement schedule ID.
   * @param payload payload with the cancellation info.
   */
  @Roles(Role.StudentCancelDisbursementSchedule)
  @Patch(":disbursementScheduleId/cancel")
  async cancelDisbursementSchedule(
    @Param("disbursementScheduleId", ParseIntPipe)
    disbursementScheduleId: number,
    @Body() payload: CancelDisbursementScheduleAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    // TODO: To be implemented.
    console.log(
      "Cancelling disbursement schedule:",
      disbursementScheduleId,
      payload,
    );
  }
}
