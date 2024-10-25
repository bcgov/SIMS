/**
 * Number of parallel processes allowed to be started at same time.
 */
export enum ParallelIntensity {
  /**
   * Used for processes that need wait more time allowing less
   * parallelism, which means they will consume more slots from
   * the thread pool, for instance, slow third-party API operations.
   */
  Regular = 2,
  /**
   * Used for regular processes that can be executed in parallel where the
   * waiting time is expected to be low, which means they will use the slots
   * from the thread pool for a shorter time, for instance, for regular quick
   * DB access.
   */
  High = 4,
}

/**
 * Execute processes in parallel during processing of high volume
 * of records to improve the performance in a controlled fashion.
 * @param createPromise Implementation that calls processing function which
 * returns a promise.
 * @param inputs Input data from which the bulk processing is done.
 * @param maxParallelRequests Maximum number of parallel processes allowed to be executed at same time.
 * @returns resolved responses of promise.
 */
export const processInParallel = async <P, I>(
  createPromise: (input: I) => Promise<P>,
  inputs: I[],
  maxParallelRequests: ParallelIntensity = ParallelIntensity.Regular,
): Promise<P[]> => {
  const resolvedResponses: P[] = [];

  // Hold all the promises that must be processed.
  const promises: Promise<P>[] = [];
  for (const input of inputs) {
    promises.push(createPromise(input));
    if (promises.length >= maxParallelRequests) {
      // Waits for all be executed.
      const response = await Promise.all(promises);
      resolvedResponses.push(...response);
      // Clear the array.
      promises.splice(0, promises.length);
    }
  }

  if (promises.length > 0) {
    // Waits for methods, if any outside the loop.
    const response = await Promise.all(promises);
    resolvedResponses.push(...response);
  }
  return resolvedResponses;
};
