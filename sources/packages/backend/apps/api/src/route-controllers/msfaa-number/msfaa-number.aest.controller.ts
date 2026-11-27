import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties, IUserToken, Role, UserGroups } from "../../auth";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { MSFAANumberService, StudentService } from "../../services";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  CancelMSFAAAPIInDTO,
  MSFAANumberAPIOutDTO,
  ReissueMSFAAAPIInDTO,
} from "./models/msfaa-number.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { CustomNamedError } from "@sims/utilities";
import { MSFAANumberSharedService } from "@sims/services";
import {
  MSFAA_INELIGIBLE,
  MSFAA_NUMBER_INVALID_OPERATION,
  MSFAA_NUMBER_NOT_FOUND,
} from "@sims/services/constants";

/**
 * MSFAA number controller for AEST Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("msfaa-number")
@ApiTags(`${ClientTypeBaseRoute.AEST}-msfaa-number`)
export class MSFAANumberAESTController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly msfaaNumberService: MSFAANumberService,
    private readonly msfaaNumberSharedService: MSFAANumberSharedService,
  ) {
    super();
  }

  /**
   * Gets the full MSFAA activity for a student, ordered by date created newest to oldest.
   * @param studentId student id to retrieve MSFAA records.
   * @returns list of MSFAA activity records for the student.
   */
  @ApiNotFoundResponse({ description: "Student not found." })
  @Get("student/:studentId")
  async getStudentMSFAAActivity(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<MSFAANumberAPIOutDTO[]> {
    const studentExists = await this.studentService.studentExists(studentId);
    if (!studentExists) {
      throw new NotFoundException("Student not found.");
    }
    const [msfaaActivity, eligibleForReissue] = await Promise.all([
      this.msfaaNumberService.getStudentMSFAAActivity(studentId),
      this.msfaaNumberSharedService.getMSFAAsEligibleForReissue(studentId),
    ]);
    const eligibleIds = new Set(eligibleForReissue.map((msfaa) => msfaa.id));
    return msfaaActivity.map((msfaa) => ({
      id: msfaa.id,
      createdAt: msfaa.createdAt,
      offeringIntensity: msfaa.offeringIntensity,
      msfaaNumber: msfaa.msfaaNumber,
      dateSent: msfaa.dateRequested,
      dateSigned: msfaa.dateSigned,
      cancelledDate: msfaa.cancelledDate,
      newIssuingProvince: msfaa.newIssuingProvince,
      canBeReissued: eligibleIds.has(msfaa.id),
    }));
  }

  /**
   * Cancels an MSFAA, setting the cancelled date and the cancellation
   * province as BC, and adds a general note to the student profile.
   * @param msfaaNumberId MSFAA to be cancelled.
   * @param payload note describing the cancellation.
   */
  @Roles(Role.StudentCancelMSFAA)
  @Patch(":msfaaNumberId/cancel")
  @ApiNotFoundResponse({ description: "MSFAA number not found." })
  @ApiUnprocessableEntityResponse({
    description: "Not possible to cancel an MSFAA that is already cancelled.",
  })
  async cancelMSFAANumber(
    @Param("msfaaNumberId", ParseIntPipe) msfaaNumberId: number,
    @Body() payload: CancelMSFAAAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.msfaaNumberService.cancelMSFAANumber(
        msfaaNumberId,
        payload.noteDescription,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case MSFAA_NUMBER_NOT_FOUND:
            throw new NotFoundException(error.message);
          case MSFAA_NUMBER_INVALID_OPERATION:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Reissues a cancelled MSFAA, cancelling any pending MSFAA for the same offering
   * intensity and associating the new MSFAA to the pending disbursements for the same
   * offering intensity. A general note is added to the student profile.
   * @param msfaaNumberId cancelled MSFAA to be reissued.
   * @param payload note describing the reissue.
   * @returns the newly created MSFAA.
   */
  @Roles(Role.StudentReissueMSFAA)
  @Post(":msfaaNumberId/reissue")
  @ApiNotFoundResponse({ description: "MSFAA number not found." })
  @ApiUnprocessableEntityResponse({
    description:
      "Not possible to reissue an MSFAA that is not cancelled or has no pending " +
      "disbursements associated.",
  })
  async reissueMSFAANumber(
    @Param("msfaaNumberId", ParseIntPipe) msfaaNumberId: number,
    @Body() payload: ReissueMSFAAAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const newMSFAA = await this.msfaaNumberService.reissueMSFAANumber(
        msfaaNumberId,
        payload.noteDescription,
        userToken.userId,
      );
      return { id: newMSFAA.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case MSFAA_NUMBER_NOT_FOUND:
            throw new NotFoundException(error.message);
          case MSFAA_INELIGIBLE:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }
}
