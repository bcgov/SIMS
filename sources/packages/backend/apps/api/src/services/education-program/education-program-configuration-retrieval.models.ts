/**
 * Program configuration required by each scenario where a configuration is retrieved.
 */
export enum RequiredProgramConfiguration {
  /**
   * Active configuration of the program year.
   * Used to create a new program for the program year.
   */
  ProgramYearActiveConfiguration = "ProgramYearActiveConfiguration",
  /**
   * Active configuration of the program year immediately after the current one.
   * Used to renew an existing program into the next program year.
   */
  NextProgramYearActiveConfiguration = "NextProgramYearActiveConfiguration",
  /**
   * Configuration the program was saved with, regardless of its active status.
   * Used to display an existing program.
   */
  ProgramAssociatedConfiguration = "ProgramAssociatedConfiguration",
  /**
   * Configuration used to update an existing program.
   * The program can be updated only if its program year has an active configuration.
   * - When the program has offerings, only a partial update is allowed, and the
   * configuration the program was saved with is used.
   * - When the program has no offerings, a full update is allowed, and the active
   * configuration of the program year is used.
   */
  ProgramAssociatedConfigurationForUpdate = "ProgramAssociatedConfigurationForUpdate",
}

/**
 * Criteria to retrieve the program configuration, based on the required configuration.
 * Each required configuration accepts only the data needed to resolve it, ensuring
 * a maximum of one configuration will be resolved.
 */
export type ProgramConfigurationCriteria =
  | {
      requiredConfiguration: RequiredProgramConfiguration.ProgramYearActiveConfiguration;
      programYearId: number;
    }
  | {
      requiredConfiguration: RequiredProgramConfiguration.NextProgramYearActiveConfiguration;
      /**
       * Program year from which the next program year is resolved.
       */
      currentProgramYearId: number;
    }
  | {
      requiredConfiguration: RequiredProgramConfiguration.ProgramAssociatedConfiguration;
      programId: number;
    }
  | {
      requiredConfiguration: RequiredProgramConfiguration.ProgramAssociatedConfigurationForUpdate;
      programId: number;
    };
