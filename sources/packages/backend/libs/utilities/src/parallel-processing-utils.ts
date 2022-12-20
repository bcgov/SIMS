import * as os from "os";

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
  maxParallelRequests = os.cpus().length,
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
