import {
  Body,
  Controller,
  NotFoundException,
  Param,
  ParseIntPipe,
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
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties, IUserToken, Role, UserGroups } from "../../auth";
import { CustomNamedError } from "@sims/utilities";
import { DisabilityProfileService } from "../../services";
import { SaveStudentDisabilityProfileAPIInDTO } from "./models/disability-profile.dto";
import {
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

  /**
   * Updates an existing disability draft profile for the student, or creates a new one if it doesn't exist.
   * Only one draft profile can exist for a student at a time.
   * @param studentId ID of the student.
   * @param saveStudentDisabilities information of the disability profile to be saved as draft, including the
   * disabilities and optionally the draft profile ID to be updated.
   */
  @Roles(Role.StudentEditDisabilityProfile)
  @Put("student/:studentId/draft")
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
  async saveDraftProfile(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Body() saveStudentDisabilities: SaveStudentDisabilityProfileAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.disabilityProfileService.saveDraftProfile(
        studentId,
        saveStudentDisabilities.disabilities,
        userToken.userId!,
        saveStudentDisabilities.disabilityProfileId,
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

  /**
   * Creates or updates an active disability profile for the student. If a draft profile exists,
   * it will be completed and become the active profile.
   * If no draft profile exists, a new active profile will be created with the provided disabilities.
   * @param studentId ID of the student.
   * @param saveStudentDisabilities information of the disability profile to be saved as active,
   * including the disabilities and optionally the draft profile ID to be completed.
   */
  @Roles(Role.StudentEditDisabilityProfile)
  @Put("student/:studentId/active")
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
  async saveActiveProfile(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Body() saveStudentDisabilities: SaveStudentDisabilityProfileAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.disabilityProfileService.saveActiveProfile(
        studentId,
        saveStudentDisabilities.disabilities,
        userToken.userId!,
        saveStudentDisabilities.disabilityProfileId,
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
