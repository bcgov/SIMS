import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties, IUserToken, Role, UserGroups } from "../../auth";
import { CustomNamedError } from "@sims/utilities";
import { DisabilityProfileControllerService } from "..";
import {
  SaveStudentDisabilityProfileAPIInDTO,
  StudentDisabilityProfileAPIOutDTO,
  StudentDisabilityProfilesAPIOutDTO,
} from "./models/disability-profile.dto";
import {
  DISABILITY_PROFILE_COMPLETE_WHEN_DRAFT_ALREADY_EXISTS,
  DISABILITY_PROFILE_DRAFT_NOT_FOUND,
  DISABILITY_PROFILE_INVALID_CATEGORY,
  DISABILITY_PROFILE_INVALID_DISABILITY_TYPE,
  DISABILITY_PROFILE_INVALID_IMPAIRMENT,
  DISABILITY_PROFILE_INVALID_PRIORITY,
} from "../../constants/error-code.constants";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { DisabilityProfileService } from "../../services";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Roles(Role.StudentEditDisabilityProfile)
@Controller("disability-profile")
@ApiTags(`${ClientTypeBaseRoute.AEST}-disability-profile`)
export class DisabilityProfileAESTController extends BaseController {
  constructor(
    private readonly disabilityProfileService: DisabilityProfileService,
    private readonly disabilityProfileControllerService: DisabilityProfileControllerService,
  ) {
    super();
  }

  /**
   * Retrieves the disability profiles for the student.
   * The student usually may have up to one active and one draft disability profile.
   * Archived provides may vary but are not expected to be more than a few for a student.
   * @param studentId ID of the student.
   */
  @Get("student/:studentId")
  async getStudentDisabilityProfiles(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<StudentDisabilityProfilesAPIOutDTO> {
    return this.disabilityProfileControllerService.getStudentDisabilityProfiles(
      {
        studentId,
      },
    );
  }

  /**
   * Retrieves a specific disability profile for the student.
   * @param disabilityProfileId ID of the disability profile.
   */
  @ApiNotFoundResponse({
    description: "Disability profile not found.",
  })
  @Get(":disabilityProfileId")
  async getStudentDisabilityProfile(
    @Param("disabilityProfileId", ParseIntPipe) disabilityProfileId: number,
  ): Promise<StudentDisabilityProfileAPIOutDTO> {
    const studentProfiles =
      await this.disabilityProfileControllerService.getStudentDisabilityProfiles(
        {
          disabilityProfileId,
        },
      );
    const [profile] = studentProfiles.profiles;
    return profile;
  }

  /**
   * Updates an existing disability draft profile for the student, or creates a new one if it doesn't exist.
   * Only one draft profile can exist for a student at a time.
   * @param studentId ID of the student.
   * @param saveStudentDisabilities information of the disability profile to be saved as draft, including the
   * disabilities and optionally the draft profile ID to be updated.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Draft disability profile not found to be updated, or " +
      "disability priorities must start at 1, be unique, and have no gaps in the sequence, or " +
      "invalid disability type, or " +
      "invalid disability category, or " +
      "invalid impairment.",
  })
  @Put("student/:studentId/draft")
  async saveDraftProfile(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Body() saveStudentDisabilities: SaveStudentDisabilityProfileAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const savedDraft = await this.disabilityProfileService.saveDraftProfile(
        studentId,
        saveStudentDisabilities.disabilities,
        userToken.userId!,
        saveStudentDisabilities.id,
      );
      return { id: savedDraft.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case DISABILITY_PROFILE_DRAFT_NOT_FOUND:
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
   * Creates new active profile or converts a draft profile to an active profile.
   * @param studentId ID of the student.
   * @param saveStudentDisabilities information of the disability profile to be saved as active,
   * including the disabilities and optionally the draft profile ID to be completed.
   */
  @Put("student/:studentId/active")
  @ApiUnprocessableEntityResponse({
    description:
      "Draft disability profile not found to be updated to complete, or " +
      "the student profile has a draft that must be completed or deleted before creating a new active profile, or " +
      "disability priorities must start at 1, be unique, and have no gaps in the sequence, or " +
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
        saveStudentDisabilities.id,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case DISABILITY_PROFILE_DRAFT_NOT_FOUND:
          case DISABILITY_PROFILE_COMPLETE_WHEN_DRAFT_ALREADY_EXISTS:
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
   * Deletes a disability profile. Only draft profiles can be deleted.
   * @param disabilityProfileId ID of the disability profile to be deleted.
   */

  @Delete(":disabilityProfileId")
  @ApiNoContentResponse({
    description: "Draft disability profile not found.",
  })
  async deleteDraftProfile(
    @Param("disabilityProfileId", ParseIntPipe) disabilityProfileId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.disabilityProfileService.deleteDraftProfile(
        disabilityProfileId,
        userToken.userId!,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case DISABILITY_PROFILE_DRAFT_NOT_FOUND:
            throw new NotFoundException(error.message);
        }
      }
      throw error;
    }
  }
}
