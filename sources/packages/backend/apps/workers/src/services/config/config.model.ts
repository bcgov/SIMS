export interface IConfig {
  /**
   * When defined as true, allows the simulation of a complete cycle of the
   * CRA send/response process that allows the workflow to proceed without
   * the need for the actual CRA verification happens. By default, it should be
   * disabled, and should be enabled only for DEV purposes on local developer
   * machine or on an environment where the CRA process is not enabled.
   */
  bypassCRAIncomeVerification: boolean;
}
