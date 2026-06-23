import { OpenshiftClient } from "./clients/openshift.client";
import type { PruneConfig } from "./models/prune.model";
import type {
  ImageStreamResource,
  ImageStreamTag,
} from "./models/openshift.model";
import {
  extractImageStreamName,
  extractImageTagName,
  getTagCreatedAt,
  getTagCreatedAtTimestamp,
} from "./utils/image.utils";

/**
 * Prunes stale OpenShift ImageStream tags for configured deployments and jobs.
 */
export class ImagePruner {
  constructor(
    private readonly config: PruneConfig,
    private readonly openshiftClient: OpenshiftClient,
  ) {}

  /**
   * Prunes stale ImageStream tags for the configured deployments and jobs, based on the provided configuration.
   * @returns A promise that resolves when the pruning process is complete.
   */
  async pruneImages(): Promise<void> {
    console.log("Starting image tag pruning...");
    console.table([
      { setting: "Environment", value: this.config.environment },
      { setting: "License plate", value: this.config.licensePlate },
      {
        setting: "Apps",
        value: this.config.applications.join(", ") || "(none)",
      },
      { setting: "Jobs", value: this.config.ocJobs.join(", ") || "(none)" },
      { setting: "Tag prefix", value: this.config.prefix },
      { setting: "Min prefix tags", value: String(this.config.minTags) },
      { setting: "Dry run", value: String(this.config.dryRun) },
    ]);

    for (const application of this.config.applications) {
      await this.pruneDeploymentApp(application);
    }

    for (const job of this.config.ocJobs) {
      await this.pruneJobApp(job);
    }

    console.log(
      `Image tag pruning completed. ${this.config.dryRun ? "DRY RUN - NO CHANGES WERE MADE TO THE CLUSTER!" : ""}`,
    );
  }

  /**
   * Prunes stale ImageStream tags for a deployment application.
   * @param appName The name of the deployment application.
   * @returns A promise that resolves when the pruning process is complete.
   */
  private async pruneDeploymentApp(appName: string): Promise<void> {
    let deployedTag: ImageStreamTag | undefined;
    let imageStream: ImageStreamResource | undefined;

    try {
      ({ deployedTag, imageStream } = await this.getDeploymentTag(appName));
    } catch (error) {
      console.warn(
        `Skipping ${appName} (deployment not found or inaccessible):`,
        error,
      );
      return;
    }

    if (!deployedTag || !imageStream) {
      console.warn(
        `Skipping ${appName} (deployed tag was not found on ImageStream).`,
      );
      return;
    }

    try {
      await this.pruneTags(imageStream, deployedTag, appName);
    } catch (error) {
      console.warn(`Skipping remaining tags for ${appName}:`, error);
    }
  }

  /**
   * Prunes stale ImageStream tags for a job application.
   * @param appName The name of the job application.
   * @returns A promise that resolves when the pruning process is complete.
   */
  private async pruneJobApp(appName: string): Promise<void> {
    let deployedTag: ImageStreamTag | undefined;
    let imageStream: ImageStreamResource | undefined;

    try {
      ({ deployedTag, imageStream } = await this.getJobTag(appName));
    } catch (error) {
      console.warn(
        `Skipping ${appName} (job not found or inaccessible):`,
        error,
      );
      return;
    }

    if (!deployedTag || !imageStream) {
      console.warn(
        `Skipping ${appName} (deployed tag was not found on ImageStream).`,
      );
      return;
    }

    try {
      await this.pruneTags(
        imageStream,
        deployedTag,
        imageStream.metadata.name || "",
      );
    } catch (error) {
      console.warn(`Skipping remaining tags for ${appName}:`, error);
    }
  }

  /**
   * Retrieves the deployed ImageStream tag for a deployment application.
   * @param appName The name of the deployment application.
   * @returns A promise that resolves with the deployed tag and image stream.
   */
  private async getDeploymentTag(appName: string): Promise<{
    deployedTag: ImageStreamTag | undefined;
    imageStream: ImageStreamResource;
  }> {
    const deploymentName = `${this.config.environment}-${appName}`;

    console.log(`\nProcessing deployment: ${deploymentName}`);

    const deployment = await this.openshiftClient.getDeployment(
      this.config.appNamespace,
      deploymentName,
    );
    const image = deployment.spec?.template?.spec?.containers[0]?.image;
    if (!image) {
      throw new Error("No container image found on deployment.");
    }

    const deployedTagName = extractImageTagName(image);

    console.log(`Deployed image tag: ${deployedTagName}`);

    const imageStream = await this.openshiftClient.getImageStream(
      this.config.toolsNamespace,
      appName,
    );
    const deployedTag = imageStream.status?.tags?.find(
      (tag) => tag.tag === deployedTagName,
    );

    return { deployedTag, imageStream };
  }

  /**
   * Retrieves the deployed ImageStream tag for a job application.
   * @param appName The name of the job application.
   * @returns A promise that resolves with the deployed tag and image stream.
   */
  private async getJobTag(appName: string): Promise<{
    deployedTag: ImageStreamTag | undefined;
    imageStream: ImageStreamResource;
  }> {
    const jobName = `${this.config.environment}-${appName}`;

    console.log(`\nProcessing job: ${jobName}`);

    const job = await this.openshiftClient.getJob(
      this.config.appNamespace,
      jobName,
    );
    const image = job.spec?.template.spec?.containers[0]?.image;
    if (!image) {
      throw new Error("No container image found on job.");
    }

    const imageStreamName = extractImageStreamName(image);
    const deployedTagName = extractImageTagName(image);

    console.log(
      `ImageStream: ${imageStreamName}, deployed image tag: ${deployedTagName}`,
    );

    const imageStream = await this.openshiftClient.getImageStream(
      this.config.toolsNamespace,
      imageStreamName,
    );
    const tags = imageStream.status?.tags ?? [];
    const deployedTag = tags.find((tag) => tag.tag === deployedTagName);

    return { deployedTag, imageStream };
  }

  private async pruneTags(
    imageStream: ImageStreamResource,
    deployedTag: ImageStreamTag,
    appIdentifier: string,
  ): Promise<void> {
    const oldPrefixTags = imageStream.status?.tags
      ?.filter(
        (tag) =>
          tag.tag.startsWith(this.config.prefix) && /.*-\d+$/.test(tag.tag),
      )
      .filter((tag) => tag.tag !== deployedTag.tag)
      .sort(
        (left, right) =>
          getTagCreatedAtTimestamp(left) - getTagCreatedAtTimestamp(right),
      );

    const prefixTagsToDelete =
      oldPrefixTags?.slice(
        0,
        Math.max(0, oldPrefixTags.length - this.config.minTags),
      ) ?? [];

    const featureTagsToDelete: ImageStreamTag[] =
      imageStream.status?.tags?.filter(
        (tag) =>
          !tag.tag.startsWith(this.config.prefix) && !tag.tag.startsWith("v"),
      ) ?? [];

    if (featureTagsToDelete.length === 0 && prefixTagsToDelete.length === 0) {
      console.log("No tags to delete.");
      return;
    }

    let failedTagDeletions = 0;

    for (const tag of prefixTagsToDelete) {
      console.log(
        `\t${appIdentifier}:${tag.tag} (Older than deployed tag, created ${getTagCreatedAt(tag)})`,
      );
      try {
        await this.deleteTag(tag, imageStream);
      } catch (error) {
        failedTagDeletions += 1;
        console.warn(`\tFailed to delete tag ${tag.tag}:`, error);
      }
    }

    for (const tag of featureTagsToDelete) {
      console.log(
        `\t${appIdentifier}:${tag.tag} (Feature tag, created ${getTagCreatedAt(tag)})`,
      );
      try {
        await this.deleteTag(tag, imageStream);
      } catch (error) {
        failedTagDeletions += 1;
        console.warn(`\tFailed to delete tag ${tag.tag}:`, error);
      }
    }

    console.log(
      `\tTotal of ${featureTagsToDelete.length + prefixTagsToDelete.length} tag(s) deleted.`,
    );
    if (failedTagDeletions > 0) {
      console.log(`\tTotal of ${failedTagDeletions} tag deletion(s) failed.`);
    }
  }

  /**
   * Deletes a specific ImageStream tag from the OpenShift cluster.
   * @param tag The ImageStream tag to delete.
   * @param imageStream The ImageStream resource containing the tag.
   * @returns A promise that resolves when the deletion is complete.
   */
  private async deleteTag(
    tag: ImageStreamTag,
    imageStream: ImageStreamResource,
  ): Promise<void> {
    const namespace = this.config.toolsNamespace;
    const imageStreamName = imageStream.metadata.name;
    if (!namespace || !imageStreamName) {
      throw new Error(
        `Missing namespace or image stream for tag deletion: ${tag.tag}.`,
      );
    }

    if (!this.config.dryRun) {
      await this.openshiftClient.deleteImageStreamTag(
        namespace,
        imageStreamName,
        tag.tag,
      );
    }
  }
}
