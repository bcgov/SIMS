import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
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
  DISABILITY_PROFILE_COMPLETE_WHEN_DRAFT_ALREADY_EXISTS,
  DISABILITY_PROFILE_DRAFT_NOT_FOUND,
  DISABILITY_PROFILE_INVALID_CATEGORY,
  DISABILITY_PROFILE_INVALID_DISABILITY_TYPE,
  DISABILITY_PROFILE_INVALID_IMPAIRMENT,
  DISABILITY_PROFILE_INVALID_PRIORITY,
} from "../../constants";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class DisabilityProfileService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly systemLookupConfigurationService: SystemLookupConfigurationService,
    @InjectRepository(StudentDisabilityProfile)
    private readonly studentDisabilityProfileRepo: Repository<StudentDisabilityProfile>,
  ) {}

  async getStudentDisabilityProfiles(
    studentId: number,
    options?: { disabilityProfileId?: number },
  ): Promise<StudentDisabilityProfile[] | null> {
    return this.studentDisabilityProfileRepo.find({
      select: {
        id: true,
        disabilityProfileStatus: true,
        completedBy: {
          id: true,
          firstName: true,
          lastName: true,
        },
        completedAt: true,
        disabilities: {
          id: true,
          disabilityPriority: true,
          disabilityCategory: true,
          disabilityType: true,
          disabilityNotes: true,
          impairments: true,
          impairmentsNotes: true,
          diagnosis: true,
          diagnosisNotes: true,
          finalNotes: true,
        },
        creator: {
          id: true,
          firstName: true,
          lastName: true,
        },
        createdAt: true,
        modifier: {
          id: true,
          firstName: true,
          lastName: true,
        },
        updatedAt: true,
      },
      relations: {
        completedBy: true,
        disabilities: true,
        creator: true,
        modifier: true,
      },
      where: {
        student: {
          id: studentId,
        },
        id: options?.disabilityProfileId,
      },
      order: {
        disabilities: {
          disabilityPriority: "ASC",
        },
      },
    });
  }

  async saveDraftProfile(
    studentId: number,
    disabilities: StudentDisabilityModel[],
    auditUserId: number,
    disabilityProfileId?: number,
  ): Promise<StudentDisabilityProfile> {
    this.validateDisabilitiesPriorities(disabilities);
    this.validateLookupData(disabilities);
    return this.dataSource.transaction(async (entityManager) => {
      const studentDisabilityProfileRepo = entityManager.getRepository(
        StudentDisabilityProfile,
      );
      const now = new Date();
      const auditUser = { id: auditUserId } as User;
      let disabilityProfile: StudentDisabilityProfile | null = null;
      // Update the existing profile.
      disabilityProfile = await studentDisabilityProfileRepo.findOne({
        select: {
          id: true,
          disabilityProfileStatus: true,
          disabilities: {
            id: true,
          },
        },
        relations: {
          disabilities: true,
        },
        where: {
          student: {
            id: studentId,
          },
          disabilityProfileStatus: DisabilityProfileStatus.Draft,
        },
      });
      if (disabilityProfile) {
        // A draft profile exists for the student.
        if (disabilityProfile.id !== disabilityProfileId) {
          // Since a draft profile exists, it must be either updated or deleted.
          // A new draft profile cannot be created if there is an existing draft profile.
          throw new CustomNamedError(
            `The provided draft disability profile ID ${disabilityProfileId} does not match the existing draft profile ID.`,
            DISABILITY_PROFILE_DRAFT_NOT_FOUND,
          );
        }
        // Draft profile exists and will be updated.
        disabilityProfile.modifier = auditUser;
        disabilityProfile.updatedAt = now;
      } else {
        // If an existing draft profile does not exist a new draft profile will be created.
        disabilityProfile = new StudentDisabilityProfile();
        disabilityProfile.disabilityProfileStatus =
          DisabilityProfileStatus.Draft;
        disabilityProfile.student = { id: studentId } as Student;
        disabilityProfile.creator = auditUser;
        disabilityProfile.createdAt = now;
      }
      disabilityProfile.disabilities = this.prepareProfileDisabilities(
        disabilities,
        disabilityProfile.disabilities,
        auditUser,
        now,
      );
      return studentDisabilityProfileRepo.save(disabilityProfile);
    });
  }

  async saveActiveProfile(
    studentId: number,
    disabilities: StudentDisabilityModel[],
    auditUserId: number,
    disabilityProfileId?: number,
  ): Promise<StudentDisabilityProfile> {
    this.validateDisabilitiesPriorities(disabilities);
    this.validateLookupData(disabilities);
    return this.dataSource.transaction(async (entityManager) => {
      const studentDisabilityProfileRepo = entityManager.getRepository(
        StudentDisabilityProfile,
      );
      const now = new Date();
      const auditUser = { id: auditUserId } as User;
      let disabilityProfile: StudentDisabilityProfile | null =
        await studentDisabilityProfileRepo.findOne({
          select: {
            id: true,
            disabilityProfileStatus: true,
            disabilities: {
              id: true,
            },
          },
          relations: {
            disabilities: true,
          },
          where: {
            student: { id: studentId },
            disabilityProfileStatus: DisabilityProfileStatus.Draft,
          },
        });
      if (
        disabilityProfileId &&
        disabilityProfileId !== disabilityProfile?.id
      ) {
        // The disabilityProfileId does not represent a draft profile for the student.
        throw new CustomNamedError(
          `Draft disability profile with ID ${disabilityProfileId} not found for the student.`,
          DISABILITY_PROFILE_DRAFT_NOT_FOUND,
        );
      }
      if (!disabilityProfileId && disabilityProfile) {
        // The student has a draft profile that must be completed or deleted.
        throw new CustomNamedError(
          `The student profile has a draft ${disabilityProfile.id} that must be completed or deleted before creating a new active profile.`,
          DISABILITY_PROFILE_COMPLETE_WHEN_DRAFT_ALREADY_EXISTS,
        );
      }
      if (disabilityProfile) {
        // Draft profile exists and will be updated.
        disabilityProfile.modifier = auditUser;
        disabilityProfile.updatedAt = now;
      } else {
        // Draft profile does not exist, create a new profile with active status.
        disabilityProfile = new StudentDisabilityProfile();
        disabilityProfile.student = { id: studentId } as Student;
        disabilityProfile.creator = auditUser;
        disabilityProfile.createdAt = now;
      }
      disabilityProfile.disabilityProfileStatus =
        DisabilityProfileStatus.Active;
      disabilityProfile.completedBy = auditUser;
      disabilityProfile.completedAt = now;
      disabilityProfile.disabilities = this.prepareProfileDisabilities(
        disabilities,
        disabilityProfile?.disabilities,
        auditUser,
        now,
      );
      // Update the current active profile (if exists) to archived status, since only one active profile is allowed.
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
      return studentDisabilityProfileRepo.save(disabilityProfile);
    });
  }

  private prepareProfileDisabilities(
    disabilitiesToSave: StudentDisabilityModel[],
    existingDisabilities: StudentDisabilityProfileDisability[] | undefined,
    auditUser: User,
    now: Date,
  ): StudentDisabilityProfileDisability[] {
    const updatedDisabilities: StudentDisabilityProfileDisability[] = [];
    for (const disabilityToSave of disabilitiesToSave ?? []) {
      // Upsert all disabilities included in the request.
      const disability = new StudentDisabilityProfileDisability();
      disability.disabilityPriority = disabilityToSave.disabilityPriority;
      disability.disabilityCategory = disabilityToSave.disabilityCategory;
      disability.disabilityType = disabilityToSave.disabilityType;
      disability.disabilityNotes = disabilityToSave.disabilityNotes;
      disability.diagnosis = disabilityToSave.diagnosis;
      disability.diagnosisNotes = disabilityToSave.diagnosisNotes;
      disability.impairments = disabilityToSave.impairments;
      disability.impairmentsNotes = disabilityToSave.impairmentsNotes;
      disability.finalNotes = disabilityToSave.finalNotes;
      const existingDisability = existingDisabilities?.find(
        (d) => d.id === disabilityToSave.id,
      );
      if (existingDisability) {
        disability.id = existingDisability.id;
        disability.modifier = auditUser;
        disability.updatedAt = now;
      } else {
        disability.creator = auditUser;
        disability.createdAt = now;
      }
      updatedDisabilities.push(disability);
    }
    if (!existingDisabilities) {
      return updatedDisabilities;
    }
    // Check for disabilities that were removed in the update and mark them as deleted.
    const updatedDisabilitiesIDs = updatedDisabilities.map(
      (disability) => disability.id,
    );
    const deletedDisabilities = existingDisabilities
      .filter((disability) => !updatedDisabilitiesIDs.includes(disability.id))
      .map((disability) => {
        disability.deletedAt = now;
        disability.modifier = auditUser;
        disability.updatedAt = now;
        return disability;
      });
    // Ensures the deleted disabilities are updated first, avoiding
    // unique constraint conflicts with the updated disabilities.
    return [...deletedDisabilities, ...updatedDisabilities];
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

  async deleteDraftProfile(
    studentId: number,
    disabilityProfileId: number,
    auditUserId: number,
  ): Promise<void> {
    const now = new Date();
    const auditUser = { id: auditUserId } as User;
    const result = await this.studentDisabilityProfileRepo.update(
      {
        id: disabilityProfileId,
        student: { id: studentId },
        disabilityProfileStatus: DisabilityProfileStatus.Draft,
      },
      { deletedAt: now, modifier: auditUser, updatedAt: now },
    );
    if (!result.affected) {
      throw new CustomNamedError(
        `Draft disability profile not found for student ID ${studentId}`,
        DISABILITY_PROFILE_DRAFT_NOT_FOUND,
      );
    }
  }
}
