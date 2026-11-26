import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, FindOperator, Raw, Repository } from "typeorm";
import {
  EducationProgram,
  EducationProgramConfiguration,
  EducationProgramOffering,
  ProgramYear,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { InstitutionService } from "../../services/institution/institution.service";
import { EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND } from "../../constants";
import { EducationProgramDynamicConfiguration } from "./education-program-save.models";
import {
  ProgramConfigurationCriteria,
  RequiredProgramConfiguration,
} from "./education-program-configuration-retrieval.models";

/**
 * Options shared by the queries retrieving a program configuration.
 */
const PROGRAM_CONFIGURATION_FIND_OPTIONS: FindOneOptions<EducationProgramConfiguration> =
  {
    select: {
      id: true,
      visualSchema: true,
      validationSchema: true,
      isActive: true,
      updatedAt: true,
      programYear: {
        id: true,
        programYear: true,
      },
    },
    relations: {
      programYear: true,
    },
  };

/**
 * Retrieves the education program configuration required by each scenario
 * (creation, renewal, view, and update), ensuring it is resolved
 * consistently from the same place.
 */
@Injectable()
export class EducationProgramConfigurationRetrievalService {
  constructor(
    @InjectRepository(EducationProgramConfiguration)
    private readonly educationProgramConfigurationRepo: Repository<EducationProgramConfiguration>,
    @InjectRepository(EducationProgram)
    private readonly educationProgramRepo: Repository<EducationProgram>,
    @InjectRepository(ProgramYear)
    private readonly programYearRepo: Repository<ProgramYear>,
    @InjectRepository(EducationProgramOffering)
    private readonly educationProgramOfferingRepo: Repository<EducationProgramOffering>,
    private readonly institutionService: InstitutionService,
  ) {}

  /**
   * Get the program configuration including visual schema, validation schema, and context.
   * Ensures the program configuration is retrieved consistently from the same place
   * for creation, renewal, view, and update operations.
   * @param institutionId ID of the institution requesting the configuration.
   * @param programConfigurationCriteria the criteria to retrieve the program configuration,
   * based on the required configuration.
   * @returns the program configuration including context, visual schema, and validation schema.
   */
  async getEducationProgramConfiguration(
    institutionId: number,
    programConfigurationCriteria: ProgramConfigurationCriteria,
  ): Promise<EducationProgramDynamicConfiguration> {
    const institutionPromise =
      this.institutionService.getInstitutionTypeById(institutionId);
    const hasOfferingsPromise = this.hasExistingOffering(
      programConfigurationCriteria,
    );
    const programConfigurationPromise = this.getRequiredProgramConfiguration(
      programConfigurationCriteria,
      hasOfferingsPromise,
    );
    const [institution, hasOfferings, programConfiguration] = await Promise.all(
      [institutionPromise, hasOfferingsPromise, programConfigurationPromise],
    );
    if (!programConfiguration) {
      throw new CustomNamedError(
        "Education program configuration not found.",
        EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND,
      );
    }
    // If the configuration is active, it is the active one for its program year;
    // otherwise, check if another configuration is active for the program year.
    const hasActiveProgramYearConfiguration =
      programConfiguration.isActive ||
      (await this.hasActiveProgramYearConfiguration(
        programConfiguration.programYear.id,
      ));
    return {
      configurationId: programConfiguration.id,
      programYearId: programConfiguration.programYear.id,
      programYearName: programConfiguration.programYear.programYear,
      hasActiveProgramYearConfiguration,
      updatedAt: programConfiguration.updatedAt,
      context: {
        isFullUpdateRestricted: hasOfferings,
        isBCPrivate: institution.institutionType.isBCPrivate,
        isBCInstitution:
          institution.institutionType.isBCPrivate ||
          institution.institutionType.isBCPublic,
      },
      visualSchema: programConfiguration.visualSchema,
      validationSchema: programConfiguration.validationSchema,
    };
  }

  /**
   * Checks if the program associated with the criteria has at least one offering.
   * @param programConfigurationCriteria the criteria to retrieve the program configuration.
   * @returns true if an existing program has offerings, otherwise false.
   */
  private hasExistingOffering(
    programConfigurationCriteria: ProgramConfigurationCriteria,
  ): Promise<boolean> {
    switch (programConfigurationCriteria.requiredConfiguration) {
      case RequiredProgramConfiguration.ProgramAssociatedConfiguration:
      case RequiredProgramConfiguration.ProgramAssociatedConfigurationForUpdate:
        return this.educationProgramOfferingRepo.exists({
          where: {
            educationProgram: { id: programConfigurationCriteria.programId },
          },
        });
      default:
        // New programs (creation or renewal) have no offerings.
        return Promise.resolve(false);
    }
  }

  /**
   * Get the program configuration required by the criteria.
   * @param programConfigurationCriteria the criteria to retrieve the program configuration.
   * @param hasOfferingsPromise indicates if the program associated with the criteria has offerings.
   * Shared with the caller to avoid checking the offerings more than once.
   * @returns the required program configuration, or null if it was not found.
   */
  private async getRequiredProgramConfiguration(
    programConfigurationCriteria: ProgramConfigurationCriteria,
    hasOfferingsPromise: Promise<boolean>,
  ): Promise<EducationProgramConfiguration | null> {
    switch (programConfigurationCriteria.requiredConfiguration) {
      case RequiredProgramConfiguration.ProgramYearActiveConfiguration:
        return this.getActiveProgramYearConfiguration(
          programConfigurationCriteria.programYearId,
        );
      case RequiredProgramConfiguration.NextProgramYearActiveConfiguration:
        return this.getActiveProgramYearConfiguration(
          this.getNextProgramYearIdCondition(
            programConfigurationCriteria.currentProgramYearId,
          ),
        );
      case RequiredProgramConfiguration.ProgramAssociatedConfiguration: {
        const program = await this.getProgramBasicInfo(
          programConfigurationCriteria.programId,
        );
        // The configuration the program was saved with must be returned regardless of
        // its active status (e.g. an existing program associated with an inactive configuration).
        return this.getProgramConfigurationById(
          program.programConfiguration.id,
        );
      }
      case RequiredProgramConfiguration.ProgramAssociatedConfigurationForUpdate: {
        const [hasOfferings, program] = await Promise.all([
          hasOfferingsPromise,
          this.getProgramBasicInfo(programConfigurationCriteria.programId),
        ]);
        const programYearId = program.programConfiguration.programYear.id;
        if (!hasOfferings) {
          // A full update is allowed, hence the active configuration
          // of the program year must be used.
          return this.getActiveProgramYearConfiguration(programYearId);
        }
        // Only a partial update is allowed, hence the configuration
        // the program was saved with must be used, as long as the
        // program year still has an active configuration.
        const [hasActiveProgramYearConfiguration, programConfiguration] =
          await Promise.all([
            this.hasActiveProgramYearConfiguration(programYearId),
            this.getProgramConfigurationById(program.programConfiguration.id),
          ]);
        return hasActiveProgramYearConfiguration ? programConfiguration : null;
      }
    }
  }

  /**
   * Checks if the program year has an active program configuration.
   * @param programYearId ID of the program year.
   * @returns true if the program year has an active configuration, otherwise false.
   */
  private hasActiveProgramYearConfiguration(
    programYearId: number,
  ): Promise<boolean> {
    return this.educationProgramConfigurationRepo.exists({
      where: { programYear: { id: programYearId }, isActive: true },
    });
  }

  /**
   * Get the basic program information (the configuration it was saved with and
   * its program year) required to resolve its configurations.
   * The program is expected to exist, since its existence must be validated by the callers.
   * @param programId ID of the program.
   * @returns the basic program information.
   */
  private getProgramBasicInfo(programId: number): Promise<EducationProgram> {
    return this.educationProgramRepo.findOneOrFail({
      select: {
        id: true,
        programConfiguration: {
          id: true,
          programYear: {
            id: true,
          },
        },
      },
      relations: {
        programConfiguration: {
          programYear: true,
        },
      },
      where: { id: programId },
    });
  }

  /**
   * Get the program configuration by its ID, regardless of its active status.
   * @param programConfigurationId ID of the program configuration.
   * @returns the program configuration, or null if it was not found.
   */
  private getProgramConfigurationById(
    programConfigurationId: number,
  ): Promise<EducationProgramConfiguration | null> {
    return this.educationProgramConfigurationRepo.findOne({
      ...PROGRAM_CONFIGURATION_FIND_OPTIONS,
      where: { id: programConfigurationId },
    });
  }

  /**
   * Get the active program configuration of a program year.
   * @param programYearId the ID of the program year or a condition
   * resolving it (e.g. a subquery).
   * @returns the active program configuration of the program year,
   * or null if the program year has no active configuration.
   */
  private getActiveProgramYearConfiguration(
    programYearId: number | FindOperator<number>,
  ): Promise<EducationProgramConfiguration | null> {
    return this.educationProgramConfigurationRepo.findOne({
      ...PROGRAM_CONFIGURATION_FIND_OPTIONS,
      where: {
        isActive: true,
        programYear: { id: programYearId },
      },
    });
  }

  /**
   * Get the next active education program configuration for renewal based
   * on the current program year.
   * The next program year is the one immediately after the current program
   * year, and its active configuration is the one expected to be used for
   * renewals.
   * @param currentProgramYearId the ID of the current program year to find
   * the next education program configuration.
   * @returns the active education program configuration of the next program
   * year, or null if there is no next program year or it has no active
   * configuration.
   */
  getNextProgramConfigurationForRenewal(
    currentProgramYearId: number,
  ): Promise<EducationProgramConfiguration | null> {
    return this.educationProgramConfigurationRepo.findOne({
      select: {
        id: true,
        isActive: true,
        programYear: {
          id: true,
          startDate: true,
        },
      },
      relations: {
        programYear: true,
      },
      where: {
        isActive: true,
        programYear: {
          id: this.getNextProgramYearIdCondition(currentProgramYearId),
        },
      },
    });
  }

  /**
   * Builds the condition to filter the program year immediately after the
   * current program year.
   * @param currentProgramYearId the ID of the current program year.
   * @returns condition to be applied to the program year ID.
   */
  private getNextProgramYearIdCondition(
    currentProgramYearId: number,
  ): FindOperator<number> {
    if (!currentProgramYearId) {
      throw new Error(
        "Current program year ID is required to find the next program configuration.",
      );
    }
    // Subquery to find the program year immediately after the current program year.
    const nextProgramYearQuery = this.programYearRepo
      .createQueryBuilder("nextProgramYear")
      .select("nextProgramYear.id")
      .innerJoin(
        ProgramYear,
        "currentProgramYear",
        "currentProgramYear.id = :currentProgramYearId",
      )
      .where("nextProgramYear.startDate > currentProgramYear.startDate")
      .orderBy("nextProgramYear.startDate", "ASC")
      .limit(1);
    return Raw((alias) => `${alias} = (${nextProgramYearQuery.getQuery()})`, {
      currentProgramYearId,
    });
  }
}
