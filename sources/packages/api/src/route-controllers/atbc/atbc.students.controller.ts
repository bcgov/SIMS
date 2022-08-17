import {
  Controller,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApiTags, ApiUnprocessableEntityResponse } from "@nestjs/swagger";
import { ATBCService, StudentService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { StudentUserToken } from "../../auth/userToken.interface";
import { ATBCCreateClientPayload, ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("atbc")
@ApiTags(`${ClientTypeBaseRoute.Student}-atbc`)
export class ATBCStudentController extends BaseController {
  constructor(
    private readonly atbcService: ATBCService,
    private readonly studentService: StudentService,
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

    // Create client payload.
    const payload: ATBCCreateClientPayload = {
      SIN: student.sinValidation.sin,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      birthDate: student.birthDate,
    };
    // API to create student profile in ATBC.
    const response = await this.atbcService.ATBCCreateClient(payload);
    if (response) {
      // Update PD Sent Date.
      await this.studentService.updatePDSentDate(student.id);
    }
  }
}
