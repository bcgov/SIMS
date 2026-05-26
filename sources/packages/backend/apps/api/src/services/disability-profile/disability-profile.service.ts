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
          additionalNotes: true,
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
      if (disabilityProfile?.id !== disabilityProfileId) {
        throw new CustomNamedError(
          `The provided draft disability profile ID ${disabilityProfileId} does not match the existing draft profile ID.`,
          DISABILITY_PROFILE_DRAFT_NOT_FOUND,
        );
      }
      if (disabilityProfile) {
        // Draft profile exists, update the modifier and updatedAt fields,
        // the disabilities will be updated later in the process.
        disabilityProfile.modifier = auditUser;
        disabilityProfile.updatedAt = now;
      } else {
        // If an existing draft profile does not exist a new draft profile will
        // be created and the existing active profile will be archived (if exists).
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
            student: {
              id: studentId,
            },
            disabilityProfileStatus: DisabilityProfileStatus.Draft,
          },
        });
      // Validate if the draft profile exists when a disabilityProfileId is provided.
      if (disabilityProfileId && !disabilityProfile) {
        throw new CustomNamedError(
          `Draft disability profile with ID ${disabilityProfileId} not found for the student.`,
          DISABILITY_PROFILE_DRAFT_NOT_FOUND,
        );
      }
      // Validate if the draft was found and it is the expected draft to be completed.
      if (disabilityProfile?.id !== disabilityProfileId) {
        throw new CustomNamedError(
          `A draft profile ID ${disabilityProfileId} exists for this student and it must be either cancelled or completed before creating a new active profile.`,
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
    return disabilitiesToSave.map((disabilitiesToSave) => {
      const disability = new StudentDisabilityProfileDisability();
      disability.diagnosis = disabilitiesToSave.diagnosis;
      disability.diagnosisNotes = disabilitiesToSave.diagnosisNotes;
      disability.disabilityPriority = disabilitiesToSave.disabilityPriority;
      disability.disabilityType = disabilitiesToSave.disabilityType;
      disability.disabilityCategory = disabilitiesToSave.disabilityCategory;
      disability.impairments = disabilitiesToSave.impairments;
      const existingDisability = existingDisabilities?.find(
        (d) => d.id === disabilitiesToSave.id,
      );
      if (existingDisability) {
        disability.id = existingDisability.id;
        disability.modifier = auditUser;
        disability.updatedAt = now;
        return disability;
      }
      disability.creator = auditUser;
      disability.createdAt = now;
      return disability;
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
