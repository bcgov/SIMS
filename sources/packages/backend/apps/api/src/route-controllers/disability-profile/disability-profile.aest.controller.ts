import {
  Body,
  Controller,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import {
  ApiNoContentResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties, IUserToken, Role, UserGroups } from "../../auth";
import {
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR,
} from "@sims/services/constants";
import { CustomNamedError } from "@sims/utilities";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { DisabilityProfileService } from "../../services";
import { StudentDisabilitiesAPIInDTO } from "./models/disability-profile.dto";
import {
  DISABILITY_PROFILE_DRAFT_ALREADY_EXISTS,
  DISABILITY_PROFILE_DRAFT_NOT_FOUND,
  DISABILITY_PROFILE_INVALID_CATEGORY,
  DISABILITY_PROFILE_INVALID_DISABILITY_TYPE,
  DISABILITY_PROFILE_INVALID_IMPAIRMENT,
  DISABILITY_PROFILE_INVALID_PRIORITY,
} from "apps/api/src/constants/error-code.constants";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("disability-profile")
@ApiTags(`${ClientTypeBaseRoute.AEST}-disability-profile`)
export class DisabilityProfileAESTController extends BaseController {
  constructor(
    private readonly disabilityProfileService: DisabilityProfileService,
  ) {
    super();
  }

  @Roles(Role.StudentEditDisabilityProfile)
  @Post(":applicationId/reissue-msfaa")
  @ApiUnprocessableEntityResponse({
    description:
      "Not possible to create an MSFAA due to an invalid application status, or " +
      "not possible to reissue an MSFAA when there is no pending disbursements for the application, or " +
      "not possible to reissue an MSFAA when the current associated MSFAA is not cancelled.",
  })
  async createDisabilityProfile(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Body() disabilities: StudentDisabilitiesAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const newDisabilityProfile =
        await this.disabilityProfileService.createDisabilityProfile(
          studentId,
          disabilities.disabilities,
          userToken.userId!,
        );
      return { id: newDisabilityProfile.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
          case APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Creates a new disability profile draft for the student.
   * Only one draft is allowed for each student, so if a draft already exists for the student, an error will be thrown.
   * @param studentId id of the student.
   * @param disabilities disabilities to be included in the new draft profile.
   * @param userToken token of the user performing the creation.
   * @returns the identifier of the newly created disability profile draft.
   */
  @Roles(Role.StudentEditDisabilityProfile)
  @Post(":studentId/draft")
  @ApiUnprocessableEntityResponse({
    description:
      "Disability priorities must start at 1, be unique, and have no gaps in the sequence, or " +
      "invalid disability type, or " +
      "invalid disability category, or " +
      "invalid impairment, or " +
      "a draft disability profile already exists for the student.",
  })
  async createDisabilityProfileDraft(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Body() disabilities: StudentDisabilitiesAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const newDisabilityProfile =
        await this.disabilityProfileService.saveDisabilityProfileDraft(
          studentId,
          disabilities.disabilities,
          userToken.userId!,
        );
      return { id: newDisabilityProfile.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case DISABILITY_PROFILE_DRAFT_NOT_FOUND:
            throw new NotFoundException(error.message);
          case DISABILITY_PROFILE_INVALID_PRIORITY:
          case DISABILITY_PROFILE_INVALID_DISABILITY_TYPE:
          case DISABILITY_PROFILE_INVALID_CATEGORY:
          case DISABILITY_PROFILE_INVALID_IMPAIRMENT:
            throw new UnprocessableEntityException(error.message);
          case DISABILITY_PROFILE_DRAFT_ALREADY_EXISTS:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }

  /**
   * Updates an existing disability draft profile for the student.
   * @param studentId id of the student.
   * @param disabilityProfileId id of the disability profile draft to be updated.
   * @param disabilities disabilities to be updated in the draft profile.
   * @param userToken token of the user performing the update.
   */
  @Roles(Role.StudentEditDisabilityProfile)
  @Put(":studentId/draft/:disabilityProfileId")
  @ApiNoContentResponse({
    description: "Draft disability profile not found for the student.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Disability priorities must start at 1, be unique, and have no gaps in the sequence, or " +
      "invalid disability type, or " +
      "invalid disability category, or " +
      "invalid impairment.",
  })
  async saveDisabilityProfileDraft(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("disabilityProfileId", ParseIntPipe) disabilityProfileId: number,
    @Body() disabilities: StudentDisabilitiesAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.disabilityProfileService.saveDisabilityProfileDraft(
        studentId,
        disabilities.disabilities,
        userToken.userId!,
        disabilityProfileId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case DISABILITY_PROFILE_DRAFT_NOT_FOUND:
            throw new NotFoundException(error.message);
          case DISABILITY_PROFILE_INVALID_PRIORITY:
          case DISABILITY_PROFILE_INVALID_DISABILITY_TYPE:
          case DISABILITY_PROFILE_INVALID_CATEGORY:
          case DISABILITY_PROFILE_INVALID_IMPAIRMENT:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }
}
