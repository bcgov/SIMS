import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { StudentDisabilityModel } from "./disability-profile.models";
import {
  DisabilityProfileStatus,
  Student,
  StudentDisabilityProfile,
  StudentDisabilityProfileDisability,
  SystemLookupCategory,
  User,
} from "@sims/sims-db/entities";
import { SystemLookupConfigurationService } from "@sims/services/system-lookup-configuration";
import { CustomNamedError } from "@sims/utilities";
import {
  DISABILITY_PROFILE_DRAFT_ALREADY_EXISTS,
  DISABILITY_PROFILE_DRAFT_NOT_FOUND,
  DISABILITY_PROFILE_INVALID_CATEGORY,
  DISABILITY_PROFILE_INVALID_DISABILITY_TYPE,
  DISABILITY_PROFILE_INVALID_IMPAIRMENT,
  DISABILITY_PROFILE_INVALID_PRIORITY,
} from "../../constants";

@Injectable()
export class DisabilityProfileService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly systemLookupConfigurationService: SystemLookupConfigurationService,
  ) {}

  // TODO: Unify the create and update operations for disability profiles, taking into consideration the status.
  async createDisabilityProfile(
    studentId: number,
    disabilities: StudentDisabilityModel[],
    auditUserId: number,
  ): Promise<StudentDisabilityProfile> {
    this.validateLookupData(disabilities);
    this.validateDisabilitiesPriorities(disabilities);
    return this.dataSource.transaction(async (entityManager) => {
      const now = new Date();
      const auditUser = { id: auditUserId } as User;
      // Set the current active disability profile to archived status.
      // If a draft profile exists, no action should be taken related to it.
      const studentDisabilityProfileRepo = entityManager.getRepository(
        StudentDisabilityProfile,
      );
      await studentDisabilityProfileRepo.update(
        {
          student: {
            id: studentId,
          },
          disabilityProfileStatus: DisabilityProfileStatus.Active,
        },
        {
          disabilityProfileStatus: DisabilityProfileStatus.Archived,
          modifier: auditUser,
          updatedAt: now,
        },
      );
      // Create the new disability profile with active status.
      const newDisabilityProfile = new StudentDisabilityProfile();
      newDisabilityProfile.student = { id: studentId } as Student;
      newDisabilityProfile.disabilityProfileStatus =
        DisabilityProfileStatus.Active;
      newDisabilityProfile.creator = auditUser;
      newDisabilityProfile.createdAt = now;
      newDisabilityProfile.disabilities = disabilities.map((disability) => {
        const newDisability = new StudentDisabilityProfileDisability();
        newDisability.disabilityType = disability.disabilityType;
        newDisability.disabilityCategory = disability.disabilityCategory;
        newDisability.impairments = disability.impairments;
        return newDisability;
      });
      return studentDisabilityProfileRepo.save(newDisabilityProfile);
    });
  }

  // TODO: Unify the create and update operations for disability profiles, taking into consideration the status.
  async saveDisabilityProfileDraft(
    studentId: number,
    status: DisabilityProfileStatus.Active | DisabilityProfileStatus.Draft,
    disabilities: StudentDisabilityModel[],
    auditUserId: number,
    disabilityProfileId?: number,
  ): Promise<StudentDisabilityProfile> {
    this.validateLookupData(disabilities);
    this.validateDisabilitiesPriorities(disabilities);
    return this.dataSource.transaction(async (entityManager) => {
      const studentDisabilityProfileRepo = entityManager.getRepository(
        StudentDisabilityProfile,
      );
      let draftProfile = await studentDisabilityProfileRepo.findOne({
        select: {
          id: true,
        },
        where: {
          id: disabilityProfileId,
          student: {
            id: studentId,
          },
          disabilityProfileStatus: DisabilityProfileStatus.Draft,
        },
      });
      if (disabilityProfileId && draftProfile?.id !== disabilityProfileId) {
        throw new CustomNamedError(
          "Draft disability profile not found for the student.",
          DISABILITY_PROFILE_DRAFT_NOT_FOUND,
        );
      }
      if (!disabilityProfileId && draftProfile) {
        throw new CustomNamedError(
          "Draft disability profile already exists for the student.",
          DISABILITY_PROFILE_DRAFT_ALREADY_EXISTS,
        );
      }
      // Upsert draft profile.
      const now = new Date();
      const auditUser = { id: auditUserId } as User;
      if (!draftProfile) {
        // Insert a new draft profile if it doesn't exist.
        draftProfile = new StudentDisabilityProfile();
        draftProfile.student = { id: studentId } as Student;
        draftProfile.disabilityProfileStatus = DisabilityProfileStatus.Draft;
        draftProfile.creator = auditUser;
        draftProfile.createdAt = now;
      } else {
        // Update the existing draft profile.
        draftProfile = draftProfile ?? new StudentDisabilityProfile();
        draftProfile.modifier = auditUser;
        draftProfile.updatedAt = now;
      }
      draftProfile.disabilities = disabilities.map((disability) => {
        const newDisability = new StudentDisabilityProfileDisability();
        newDisability.disabilityType = disability.disabilityType;
        newDisability.disabilityCategory = disability.disabilityCategory;
        newDisability.impairments = disability.impairments;
        return newDisability;
      });
      return studentDisabilityProfileRepo.save(draftProfile);
    });
  }

  private validateDisabilitiesPriorities(
    disabilities: StudentDisabilityModel[],
  ) {
    const sortedPriorities = disabilities
      .map((d) => d.disabilityPriority)
      .sort((a, b) => a - b);
    const isValidSequence = sortedPriorities.every((p, i) => p === i + 1);
    if (!isValidSequence) {
      throw new CustomNamedError(
        "Disability priorities must start at 1, be unique, and have no gaps in the sequence.",
        DISABILITY_PROFILE_INVALID_PRIORITY,
      );
    }
  }

  private validateLookupData(disabilities: StudentDisabilityModel[]) {
    for (const disability of disabilities) {
      // Disability type
      const hasValidDisabilityType =
        this.systemLookupConfigurationService.isValidSystemLookup(
          SystemLookupCategory.DisabilityType,
          disability.disabilityType,
        );
      if (!hasValidDisabilityType) {
        throw new CustomNamedError(
          `Invalid disability type: ${disability.disabilityType}`,
          DISABILITY_PROFILE_INVALID_DISABILITY_TYPE,
        );
      }
      // Disability category
      const hasValidDisabilityCategory =
        this.systemLookupConfigurationService.isValidSystemLookup(
          SystemLookupCategory.DisabilityCategory,
          disability.disabilityCategory,
        );
      if (!hasValidDisabilityCategory) {
        throw new CustomNamedError(
          `Invalid disability category: ${disability.disabilityCategory}`,
          DISABILITY_PROFILE_INVALID_CATEGORY,
        );
      }
      // Impairments
      for (const impairment of disability.impairments) {
        const hasValidImpairment =
          this.systemLookupConfigurationService.isValidSystemLookup(
            SystemLookupCategory.DisabilityImpairment,
            impairment,
          );
        if (!hasValidImpairment) {
          throw new CustomNamedError(
            `Invalid disability impairment: ${impairment}`,
            DISABILITY_PROFILE_INVALID_IMPAIRMENT,
          );
        }
      }
    }
  }
}
