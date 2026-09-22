import { OpenshiftClient } from "../clients/openshift.client";
import type { PruneConfig } from "./models/prune.model";
import type {
  ImageStreamResource,
  ImageStreamTag,
} from "../models/openshift.model";
import {
  extractImageStreamName,
  extractImageTagName,
  getReleaseVersionKey,
  getTagCreatedAt,
  getTagCreatedAtTimestamp,
  isReleaseTag,
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
      {
        setting: "Environments",
        value:
          this.config.environments
            .map(
              (environment) => `${environment.name} (${environment.namespace})`,
            )
            .join(", ") || "(none)",
      },
      { setting: "License plate", value: this.config.licensePlate },
      {
        setting: "Apps",
        value: this.config.applications.join(", ") || "(none)",
      },
      { setting: "Jobs", value: this.config.ocJobs.join(", ") || "(none)" },
      { setting: "Tag prefix", value: this.config.prefix },
      { setting: "Min prefix tags", value: String(this.config.minTags) },
      {
        setting: "Min release versions",
        value: String(this.config.minReleaseVersions),
      },
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
    const deployedTags = await this.getDeploymentTags(appName);

    if (deployedTags.size === 0) {
      console.warn(
        `Skipping ${appName} (no deployed tag was found in any environment).`,
      );
      return;
    }

    let imageStream: ImageStreamResource;
    try {
      imageStream = await this.openshiftClient.getImageStream(
        this.config.toolsNamespace,
        appName,
      );
    } catch (error) {
      console.warn(
        `Skipping ${appName} (image stream not found or inaccessible):`,
        error,
      );
      return;
    }

    try {
      await this.pruneTags(imageStream, deployedTags, appName);
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
    const { deployedTags, imageStreamName } = await this.getJobTags(appName);

    if (deployedTags.size === 0 || !imageStreamName) {
      console.warn(
        `Skipping ${appName} (no deployed tag was found in any environment).`,
      );
      return;
    }

    let imageStream: ImageStreamResource;
    try {
      imageStream = await this.openshiftClient.getImageStream(
        this.config.toolsNamespace,
        imageStreamName,
      );
    } catch (error) {
      console.warn(
        `Skipping ${appName} (image stream not found or inaccessible):`,
        error,
      );
      return;
    }

    try {
      await this.pruneTags(
        imageStream,
        deployedTags,
        imageStream.metadata.name || appName,
      );
    } catch (error) {
      console.warn(`Skipping remaining tags for ${appName}:`, error);
    }
  }

  /**
   * Gets the deployed image tag for a deployment application across the configured
   * environments (e.g. dev, test, prod), so none of them are ever pruned regardless of age.
   * @param appName The name of the deployment application.
   * @returns The set of deployed tag names found across all checked environments.
   */
  private async getDeploymentTags(appName: string): Promise<Set<string>> {
    const deployedTags = new Set<string>();

    console.log(`*** ${appName} ***`);

    for (const { name, namespace } of this.config.environments) {
      const deploymentName = `${name}-${appName}`;
      try {
        const deployment = await this.openshiftClient.getDeployment(
          namespace,
          deploymentName,
        );
        const image = deployment.spec?.template?.spec?.containers[0]?.image;
        if (image) {
          const tagName = extractImageTagName(image);
          deployedTags.add(tagName);
          console.log(
            `Deployed tag for ${deploymentName} in ${namespace}:`,
            tagName,
          );
        }
      } catch (error) {
        console.warn(
          `No deployment found for ${deploymentName} in ${namespace}:`,
          error,
        );
      }
    }

    return deployedTags;
  }

  /**
   * Gets the deployed image tag for a job application across the configured environments
   * (e.g. dev, test, prod), so none of them are ever pruned regardless of age.
   * @param appName The name of the job application.
   * @returns The set of deployed tag names and the resolved ImageStream name.
   */
  private async getJobTags(appName: string): Promise<{
    deployedTags: Set<string>;
    imageStreamName?: string;
  }> {
    console.log(`*** ${appName} ***`);

    const deployedTags = new Set<string>();
    let imageStreamName: string | undefined;

    for (const { name, namespace } of this.config.environments) {
      const jobName = `${name}-${appName}`;
      try {
        const job = await this.openshiftClient.getJob(namespace, jobName);
        const image = job.spec?.template.spec?.containers[0]?.image;
        if (image) {
          imageStreamName ??= extractImageStreamName(image);
          const tagName = extractImageTagName(image);
          deployedTags.add(tagName);
          console.log(`Deployed tag for ${jobName} in ${namespace}:`, tagName);
        }
      } catch (error) {
        console.warn(`No job found for ${jobName} in ${namespace}:`, error);
      }
    }

    return { deployedTags, imageStreamName };
  }

  /**
   * Prunes old image tags from an ImageStream based on the configured retention policy.
   * @param imageStream The ImageStream resource to prune tags from.
   * @param protectedTags The set of tags that should never be deleted.
   * @param appIdentifier The identifier of the application for logging purposes.
   */
  private async pruneTags(
    imageStream: ImageStreamResource,
    protectedTags: Set<string>,
    appIdentifier: string,
  ): Promise<void> {
    const releaseTagsToDelete = this.getReleaseTagsToDelete(
      imageStream,
      protectedTags,
    );
    const prefixTagsToDelete = await this.getPrefixTagsToDelete(
      imageStream,
      protectedTags,
    );

    const featureTagsToDelete = await this.getFeatureTagsToDelete(
      imageStream,
      protectedTags,
    );

    if (
      featureTagsToDelete.length === 0 &&
      prefixTagsToDelete.length === 0 &&
      releaseTagsToDelete.length === 0
    ) {
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

    for (const tag of releaseTagsToDelete) {
      console.log(
        `\t${appIdentifier}:${tag.tag} (Release version outside the last ${this.config.minReleaseVersions} kept versions, created ${getTagCreatedAt(tag)})`,
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
      `\tTotal of ${featureTagsToDelete.length + prefixTagsToDelete.length + releaseTagsToDelete.length} tag(s) ${this.config.dryRun ? "to be deleted" : "deleted"}.`,
    );
    if (failedTagDeletions > 0) {
      console.log(`\tTotal of ${failedTagDeletions} tag deletion(s) failed.`);
    }
  }

  private async getFeatureTagsToDelete(
    imageStream: ImageStreamResource,
    protectedTags: Set<string>,
  ): Promise<ImageStreamTag[]> {
    const featureTagsToDelete: ImageStreamTag[] =
      imageStream.status?.tags
        ?.filter((tag) => !protectedTags.has(tag.tag))
        .filter(
          (tag) =>
            !tag.tag.startsWith(this.config.prefix) && !isReleaseTag(tag.tag),
        ) ?? [];

    return featureTagsToDelete;
  }

  private async getPrefixTagsToDelete(
    imageStream: ImageStreamResource,
    protectedTags: Set<string>,
  ): Promise<ImageStreamTag[]> {
    const oldPrefixTags = imageStream.status?.tags
      ?.filter(
        (tag) =>
          tag.tag.startsWith(this.config.prefix) && /.*-\d+$/.test(tag.tag),
      )
      .filter((tag) => !protectedTags.has(tag.tag))
      .sort(
        (left, right) =>
          getTagCreatedAtTimestamp(left) - getTagCreatedAtTimestamp(right),
      );

    const prefixTagsToDelete =
      oldPrefixTags?.slice(
        0,
        Math.max(0, oldPrefixTags.length - this.config.minTags),
      ) ?? [];

    return prefixTagsToDelete;
  }

  /**
   * Determines which release tags should be deleted, keeping only the most recent
   * `minReleaseVersions` release versions (grouped by major.minor, builds and patches
   * included) and never deleting a currently deployed release.
   * @param imageStream The ImageStream containing the candidate tags.
   * @param protectedTags Tag names that must never be deleted.
   * @returns The release tags to be deleted.
   */
  private getReleaseTagsToDelete(
    imageStream: ImageStreamResource,
    protectedTags: Set<string>,
  ): ImageStreamTag[] {
    const versionGroups = new Map<string, ImageStreamTag[]>();

    for (const tag of imageStream.status?.tags ?? []) {
      const versionKey = getReleaseVersionKey(tag.tag);
      if (!versionKey) {
        continue;
      }
      const group = versionGroups.get(versionKey) ?? [];
      group.push(tag);
      versionGroups.set(versionKey, group);
    }

    const versionKeysNewestFirst = [...versionGroups.keys()].sort(
      (left, right) => right.localeCompare(left, undefined, { numeric: true }),
    );
    const versionKeysToKeep = new Set(
      versionKeysNewestFirst.slice(0, this.config.minReleaseVersions),
    );

    return [...versionGroups.entries()]
      .filter(([versionKey]) => !versionKeysToKeep.has(versionKey))
      .flatMap(([, tags]) => tags)
      .filter((tag) => !protectedTags.has(tag.tag));
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
