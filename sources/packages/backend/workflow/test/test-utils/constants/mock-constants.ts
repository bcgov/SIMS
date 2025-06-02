/**
 * Separator used while creating mock variables names resulted
 * from the concatenation of other identifiers.
 */
export const MOCKS_SEPARATOR = "_";
/**
 * Service task id separator usually used on workflows to identify
 * the service task ids.
 */
export const SERVICE_TASK_ID_SEPARATOR = "-";
/**
 * Suffix of the mocked objects intended to be returned as a result
 * of a service task completed job.
 */
export const JOB_COMPLETED_RESULT_SUFFIX = "result";
/**
 * Suffix of the mocked objects intended to be used as a message
 * payload to be published to the workflow.
 */
export const JOB_MESSAGE_RESULT_SUFFIX = "messageResult";
/**
 * Identifier of subprocesses in the workflow.
 */
export const PARENT_SUBPROCESSES_VARIABLE = "parentSubprocesses";
/**
 * Suffix that indicates if a task or subprocess was invoked by the workflow.
 */
export const JOB_PASSTHROUGH_SUFFIX = "passthrough";

export const MULTI_INSTANCE_LOOP_COUNTER = "loopCounter";

export const IS_MULTI_INSTANCE = "isMultiInstance";

export const INSTANCES = "instances";
