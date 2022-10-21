/**
 * Suggested values to be considered while defining the
 * amount of jobs that a worker can request to be activated.
 * !The best choice for every scenario can be defined only after
 * !some benchmarks are acquired. The below options and descriptions
 * !are just a suggestion to have a start point. As a general recommendation
 * !activating one job per call does not seems a recommended practice.
 */
export enum MaxJobsToActivate {
  /**
   * Minimum recommended value.
   */
  Minimum = 5,
  /**
   * Used for more complex operations, for instance, when multiples interactions
   * with the DB are needed in order to the worker finish the job.
   */
  Low = 10,
  /**
   * Used for a more granular option between Low and Normal. As a general recommendation
   * the Low should be used only for extremely heavy or complex operations, please consider
   * using this as a first option unless Low is really required.
   */
  Medium = 20,
  /**
   * Default value when not provided.
   * Used for operations where the regular execution, considering
   * all the activated jobs, could take a second or a couple of seconds.
   */
  Normal = 32,
  /**
   * Used for simple operations where the regular execution, considering
   * all the activated jobs, could take few milliseconds to a second or slightly more.
   */
  High = 48,
  /**
   * Used for really simple operations where the regular execution, considering
   * all the activated jobs, should not take more than few milliseconds.
   */
  Maximum = 64,
}
