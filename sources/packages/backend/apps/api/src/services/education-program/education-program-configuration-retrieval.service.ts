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
  ResolvedProgramConfiguration,
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
    const hasOfferingsPromise = this.hasExistingOffering(
      programConfigurationCriteria,
    );
    const [
      institution,
      hasOfferings,
      { programConfiguration, hasActiveProgramYearConfiguration },
    ] = await Promise.all([
      this.institutionService.getInstitutionTypeById(institutionId),
      hasOfferingsPromise,
      this.resolveProgramConfiguration(
        programConfigurationCriteria,
        hasOfferingsPromise,
      ),
    ]);
    if (!programConfiguration) {
      throw new CustomNamedError(
        "Education program configuration not found.",
        EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND,
      );
    }
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
   * Resolves the program configuration required by the criteria.
   * @param programConfigurationCriteria the criteria to retrieve the program configuration.
   * @param hasOfferingsPromise indicates if the program associated with the criteria has offerings.
   * Shared with the caller to avoid checking the offerings more than once.
   * @returns the required program configuration, or null if it was not found,
   * along with the indication if its program year has an active configuration.
   */
  private async resolveProgramConfiguration(
    programConfigurationCriteria: ProgramConfigurationCriteria,
    hasOfferingsPromise: Promise<boolean>,
  ): Promise<ResolvedProgramConfiguration> {
    switch (programConfigurationCriteria.requiredConfiguration) {
      case RequiredProgramConfiguration.ProgramYearActiveConfiguration: {
        const programConfiguration =
          await this.getActiveProgramYearConfiguration(
            programConfigurationCriteria.programYearId,
          );
        return {
          programConfiguration,
          hasActiveProgramYearConfiguration: !!programConfiguration,
        };
      }
      case RequiredProgramConfiguration.NextProgramYearActiveConfiguration: {
        const programConfiguration =
          await this.getActiveProgramYearConfiguration(
            this.getNextProgramYearIdCondition(
              programConfigurationCriteria.currentProgramYearId,
            ),
          );
        return {
          programConfiguration,
          hasActiveProgramYearConfiguration: !!programConfiguration,
        };
      }
      case RequiredProgramConfiguration.ProgramAssociatedConfiguration: {
        const program = await this.getProgramBasicInfo(
          programConfigurationCriteria.programId,
        );
        // The configuration the program was saved with must be returned regardless of
        // its active status (e.g. an existing program associated with an inactive configuration).
        return this.getProgramSavedConfiguration(program);
      }
      case RequiredProgramConfiguration.ProgramAssociatedConfigurationForUpdate: {
        const [hasOfferings, program] = await Promise.all([
          hasOfferingsPromise,
          this.getProgramBasicInfo(programConfigurationCriteria.programId),
        ]);
        if (!hasOfferings) {
          // A full update is allowed, hence the active configuration
          // of the program year must be used.
          const programConfiguration =
            await this.getActiveProgramYearConfiguration(
              program.programConfiguration.programYear.id,
            );
          return {
            programConfiguration,
            hasActiveProgramYearConfiguration: !!programConfiguration,
          };
        }
        // Only a partial update is allowed, hence the configuration
        // the program was saved with must be used, as long as the
        // program year still has an active configuration.
        const { programConfiguration, hasActiveProgramYearConfiguration } =
          await this.getProgramSavedConfiguration(program);
        return {
          programConfiguration: hasActiveProgramYearConfiguration
            ? programConfiguration
            : null,
          hasActiveProgramYearConfiguration,
        };
      }
    }
  }

  /**
   * Get the configuration the program was saved with, regardless of its
   * active status, along with the indication if its program year has an
   * active configuration.
   * @param program program with the basic information of its saved configuration.
   * @returns the configuration the program was saved with, and the indication
   * if its program year has an active configuration.
   */
  private async getProgramSavedConfiguration(
    program: EducationProgram,
  ): Promise<ResolvedProgramConfiguration> {
    // If the saved configuration is active, it is the active one for its program year;
    // otherwise, check if another configuration is active for the program year.
    const [programConfiguration, hasActiveProgramYearConfiguration] =
      await Promise.all([
        this.getProgramConfigurationById(program.programConfiguration.id),
        program.programConfiguration.isActive ||
          this.educationProgramConfigurationRepo.exists({
            where: {
              isActive: true,
              programYear: { id: program.programConfiguration.programYear.id },
            },
          }),
      ]);
    return { programConfiguration, hasActiveProgramYearConfiguration };
  }

  /**
   * Get the basic program information (the configuration it was saved with,
   * its active status, and its program year) required to resolve its configurations.
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
          isActive: true,
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
   * Checks if the program year immediately after the current one has an
   * active education program configuration, allowing programs of the
   * current program year to be renewed.
   * @param currentProgramYearId the ID of the current program year.
   * @returns true if the next program year has an active configuration,
   * otherwise false.
   */
  hasNextProgramConfigurationForRenewal(
    currentProgramYearId: number,
  ): Promise<boolean> {
    return this.educationProgramConfigurationRepo.exists({
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
