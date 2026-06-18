import type { PruneConfig } from "./models/prune.model";
import type {
  OpenShiftClient,
  ImageStreamTag,
  ImageStreamResource,
} from "./models/openshift.model";
import {
  deleteImageStreamTag,
  getDeployment,
  getImageStream,
  getJob,
} from "./clients/openshift.client";

interface PrunerRuntimeContext {
  client: OpenShiftClient;
  config: PruneConfig;
}

let runtimeContext: PrunerRuntimeContext | undefined;

/**
 * Initializes the module-level runtime context for pruning.
 * @param client The initialized OpenShift client.
 * @param config The pruning configuration.
 */
export function initializePruner(
  client: OpenShiftClient,
  config: PruneConfig,
): void {
  runtimeContext = { client, config };
}

function getRuntimeContext(): PrunerRuntimeContext {
  if (!runtimeContext) {
    throw new Error("Pruner context is not initialized.");
  }

  return runtimeContext;
}

/**
 * Extracts the ImageStream name from a full image reference string.
 * For example, "registry.apps.gold/ns/db-migrations-sims:main-12345"
 * returns "db-migrations-sims".
 * @param image The full image reference string.
 * @returns The ImageStream name portion of the image reference.
 */
export function extractImageStreamName(image: string): string {
  const parts = image.split(/[/:]/);
  if (parts.length < 2) {
    throw new Error(`Cannot extract ImageStream name from image: ${image}.`);
  }

  return parts.at(-2) || "";
}

/**
 * Extracts the image tag name from a full image reference string.
 * @param image The full image reference string.
 * @returns The image tag name.
 */
export function extractImageTagName(image: string): string {
  const imageWithoutDigest = image.split("@")[0];
  const lastColon = imageWithoutDigest.lastIndexOf(":");
  if (lastColon === -1 || lastColon === imageWithoutDigest.length - 1) {
    throw new Error(`Cannot extract image tag from image: ${image}.`);
  }

  return imageWithoutDigest.slice(lastColon + 1);
}

function getTagCreatedAt(tag: ImageStreamTag): string {
  return tag.items?.[0]?.created ?? "unknown";
}

function getTagCreatedAtTimestamp(tag: ImageStreamTag): number {
  const createdAtTimestamp = Date.parse(getTagCreatedAt(tag));
  if (Number.isNaN(createdAtTimestamp)) {
    throw new TypeError(
      `Invalid creation timestamp for tag ${tag.tag}: ${getTagCreatedAt(tag)}.`,
    );
  }

  return createdAtTimestamp;
}

async function getDeploymentTag(appName: string): Promise<{
  deployedTag: ImageStreamTag | undefined;
  imageStream: ImageStreamResource;
}> {
  try {
    const { client, config } = getRuntimeContext();
    const deploymentName = `${config.environment}-${appName}`;

    console.log(`\nProcessing deployment: ${deploymentName}`);

    const deployment = await getDeployment(
      client,
      config.appNamespace,
      deploymentName,
    );
    const image = deployment.spec.template.spec.containers[0]?.image;
    if (!image) {
      throw new Error("No container image found on deployment.");
    }

    const deployedTagName = extractImageTagName(image);

    console.log(`Deployed image tag: ${deployedTagName}`);

    const imageStream = await getImageStream(
      client,
      config.toolsNamespace,
      appName,
    );
    const deployedTag = imageStream.status?.tags?.find(
      (tag) => tag.tag === deployedTagName,
    );
    return { deployedTag, imageStream };
  } catch (error) {
    throw new Error(
      `Skipping ${appName} (deployment not found or inaccessible): ${error}`,
    );
  }
}

async function getJobTag(appName: string): Promise<{
  deployedTag: ImageStreamTag | undefined;
  imageStream: ImageStreamResource;
}> {
  try {
    const { client, config } = getRuntimeContext();
    const jobName = `${config.environment}-${appName}`;

    console.log(`\nProcessing job: ${jobName}`);

    const job = await getJob(client, config.appNamespace, jobName);
    const image = job.spec.template.spec.containers[0]?.image;
    if (!image) {
      throw new Error("No container image found on job.");
    }

    const imageStreamName = extractImageStreamName(image);
    const deployedTagName = extractImageTagName(image);

    console.log(
      `ImageStream: ${imageStreamName}, deployed image tag: ${deployedTagName}`,
    );

    const imageStream = await getImageStream(
      client,
      config.toolsNamespace,
      imageStreamName,
    );
    const tags = imageStream.status?.tags ?? [];
    const deployedTag = tags.find((tag) => tag.tag === deployedTagName);
    return { deployedTag, imageStream };
  } catch (error) {
    throw new Error(
      `Skipping ${appName} (job not found or inaccessible): ${error}`,
    );
  }
}

/**
 * Deletes a single ImageStream tag via the OpenShift REST API.
 * In dry-run mode, skips the actual deletion.
 * @param tag The tag name to delete.
 * @param imageStream The parent image stream that owns the tag.
 * @returns A promise that resolves when the tag deletion step completes.
 */
export async function deleteTag(
  tag: ImageStreamTag,
  imageStream: ImageStreamResource,
): Promise<void> {
  const { client, config } = getRuntimeContext();
  const namespace = config.toolsNamespace;
  const imageStreamName = imageStream.metadata.name;
  if (!namespace || !imageStreamName) {
    throw new Error(
      `Missing namespace or image stream for tag deletion: ${tag.tag}.`,
    );
  }

  if (!config.dryRun) {
    await deleteImageStreamTag(client, namespace, imageStreamName, tag.tag);
  }
}

async function pruneTags(
  imageStream: ImageStreamResource,
  deployedTag: ImageStreamTag,
  appIdentifier: string,
): Promise<void> {
  const { config } = getRuntimeContext();

  const oldPrefixTags = imageStream.status?.tags
    ?.filter(
      // Filter tags that match the prefix (main-*)
      (tag) => tag.tag.startsWith(config.prefix) && /.*-\d+$/.test(tag.tag),
    )
    .filter(
      // Exclude the currently deployed tag.
      (tag) => tag.tag !== deployedTag.tag,
    )
    .sort(
      // Sort by creation date ascending (oldest first)
      (left, right) =>
        getTagCreatedAtTimestamp(left) - getTagCreatedAtTimestamp(right),
    );

  // Select tags to delete, keeping at least `config.minTags` most recent ones.
  const prefixTagsToDelete =
    oldPrefixTags?.slice(
      0,
      Math.max(0, oldPrefixTags.length - config.minTags),
    ) ?? [];

  // Select tags to delete that don't match the prefix (main-*) and don't look like release tags (v*).
  // These have no retention policy and will be deleted regardless of age
  const featureTagsToDelete: ImageStreamTag[] =
    imageStream.status?.tags?.filter(
      (tag) => !tag.tag.startsWith(config.prefix) && !tag.tag.startsWith("v"),
    ) ?? [];

  if (featureTagsToDelete.length === 0 && prefixTagsToDelete.length === 0) {
    console.log("No tags to delete.");
    return;
  }

  for (const tag of prefixTagsToDelete) {
    console.log(
      `  ${appIdentifier}:${tag.tag} (Older than deployed tag, created ${getTagCreatedAt(tag)})`,
    );
    await deleteTag(tag, imageStream);
  }

  for (const tag of featureTagsToDelete) {
    console.log(
      `  ${appIdentifier}:${tag.tag} (Feature tag, created ${getTagCreatedAt(tag)})`,
    );
    await deleteTag(tag, imageStream);
  }

  console.log(
    `  Total of ${featureTagsToDelete.length + prefixTagsToDelete.length} tag(s) deleted.`,
  );
}

/**
 * Prunes old ImageStream tags for a Deployment-backed application.
 * Deletes prefix tags (e.g., main-*) older than the currently deployed tag
 * (minus a configurable safety buffer) and all feature branch tags.
 * @param appName The application name matching both the ImageStream name and the Deployment name suffix.
 * @returns A promise that resolves when deployment tag pruning completes.
 */
export async function pruneDeploymentApp(appName: string): Promise<void> {
  const { deployedTag, imageStream } = (await getDeploymentTag(appName)) ?? {};
  if (!deployedTag || !imageStream) {
    console.warn(
      `Skipping ${appName} (deployed tag was not found on ImageStream).`,
    );
    return;
  }
  await pruneTags(imageStream, deployedTag, appName);
}

/**
 * Prunes old ImageStream tags for a Job-backed application.
 * Uses the same logic as pruneDeploymentApp but reads the deployed tag
 * from an OpenShift Job resource instead of a Deployment. The ImageStream name
 * is also derived from the job's container image, since it may differ from
 * the job name.
 * @param appName The application name matching the Job name suffix.
 * @returns A promise that resolves when job tag pruning completes.
 */
export async function pruneJobApp(appName: string): Promise<void> {
  const { deployedTag, imageStream } = await getJobTag(appName);
  if (!deployedTag || !imageStream) {
    console.warn(
      `Skipping ${appName} (deployed tag was not found on ImageStream).`,
    );
    return;
  }
  await pruneTags(imageStream, deployedTag, imageStream.metadata.name || "");
}
