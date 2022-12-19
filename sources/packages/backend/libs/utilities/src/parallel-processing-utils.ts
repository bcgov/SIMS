import * as os from "os";

/**
 * Execute processes in parallel during processing of high volume
 * of records to improve the performance in a controlled fashion.
 * @param createPromise Implementation that calls processing function which
 * returns a promise.
 * @param inputs input data from which the bulk processing is done.
 * @param maxParallelRequests  Maximum number of parallel processes allowed to be executed at same time.
 * @returns resolved responses of promise.
 */
export const processRequestsInParallel = async <P, I>(
  createPromise: (record: I) => Promise<P>,
  inputs: I[],
  maxParallelRequests?: number,
): Promise<P[]> => {
  const resolvedResponses: P[] = [];
  // Used to limit the number of asynchronous operations
  // that will start at the same time.
  const maxPromisesAllowed = maxParallelRequests ?? os.cpus().length;

  // Hold all the promises that must be processed.
  const promises: Promise<P>[] = [];
  for (const input of inputs) {
    promises.push(createPromise(input));
    if (promises.length >= maxPromisesAllowed) {
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
