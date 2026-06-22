import { config as loadDotEnv } from "dotenv";
import { OpenshiftClient } from "./clients/openshift.client";
import type { PruneConfig } from "./models/prune.model";
import type {
  ImageStreamResource,
  ImageStreamTag,
} from "./models/openshift.model";

loadDotEnv();

/**
 * Prunes stale OpenShift ImageStream tags for configured deployments and jobs.
 */
class ImagePruner {
  constructor(
    private readonly config: PruneConfig,
    private readonly openshiftClient: OpenshiftClient,
  ) {}

  async run(): Promise<void> {
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

    console.log("\n" + "=".repeat(80));
    console.log(
      `Image tag pruning completed. ${this.config.dryRun ? "DRY RUN - NO CHANGES WERE MADE TO THE CLUSTER!" : ""}`,
    );
    console.log("\n" + "=".repeat(80));
  }

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

    await this.pruneTags(imageStream, deployedTag, appName);
  }

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

    await this.pruneTags(
      imageStream,
      deployedTag,
      imageStream.metadata.name || "",
    );
  }

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
    const image = deployment.spec.template.spec.containers[0]?.image;
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
    const image = job.spec.template.spec.containers[0]?.image;
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

    for (const tag of prefixTagsToDelete) {
      console.log(
        `  ${appIdentifier}:${tag.tag} (Older than deployed tag, created ${getTagCreatedAt(tag)})`,
      );
      await this.deleteTag(tag, imageStream);
    }

    for (const tag of featureTagsToDelete) {
      console.log(
        `  ${appIdentifier}:${tag.tag} (Feature tag, created ${getTagCreatedAt(tag)})`,
      );
      await this.deleteTag(tag, imageStream);
    }

    console.log(
      `  Total of ${featureTagsToDelete.length + prefixTagsToDelete.length} tag(s) deleted.`,
    );
  }

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
  const createdAt = getTagCreatedAt(tag);
  const createdAtTimestamp = Date.parse(createdAt);
  if (Number.isNaN(createdAtTimestamp)) {
    console.warn(
      `Invalid creation timestamp for tag ${tag.tag}: ${createdAt}. Treating as oldest.`,
    );
    return 0;
  }

  return createdAtTimestamp;
}

/**
 * Loads and validates the pruner configuration from environment variables and command line arguments.
 * @returns The validated prune configuration.
 */
function loadConfig(): PruneConfig {
  const environment = process.env.ENVIRONMENT;
  const saToken = process.env.SA_TOKEN;
  const openShiftUrl = process.env.OPENSHIFT_URL?.replace(/\/$/, "");
  const licensePlate = process.env.LICENSE_PLATE;

  if (!saToken) {
    throw new Error("Missing required environment variable: SA_TOKEN.");
  }
  if (!openShiftUrl) {
    throw new Error("Missing required environment variable: OPENSHIFT_URL.");
  }
  if (!licensePlate) {
    throw new Error("Missing required environment variable: LICENSE_PLATE.");
  }
  if (!environment) {
    throw new Error("Missing required environment variable: ENVIRONMENT.");
  }
  if (!["dev", "test", "prod"].includes(environment)) {
    throw new Error(
      `ENVIRONMENT must be one of: dev, test, prod. Got: ${environment}.`,
    );
  }

  const minTags = Number.parseInt(process.env.MIN_TAGS ?? "2", 10);
  if (Number.isNaN(minTags) || minTags < 0) {
    throw new Error(
      `MIN_TAGS must be a non-negative integer. Got: ${process.env.MIN_TAGS}.`,
    );
  }

  return {
    saToken,
    openShiftUrl,
    licensePlate,
    toolsNamespace: `${licensePlate}-tools`,
    appNamespace: `${licensePlate}-${environment}`,
    environment,
    applications: (process.env.APPLICATIONS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    ocJobs: (process.env.OCJOBS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    prefix: process.env.PREFIX ?? "main",
    minTags,
    dryRun: !process.argv.includes("--confirm"),
  };
}

/**
 * Script main execution method.
 */
(async () => {
  try {
    const config = loadConfig();
    const openshiftClient = await OpenshiftClient.create({
      config: {
        openShiftUrl: config.openShiftUrl,
        licensePlate: config.licensePlate,
        saToken: config.saToken,
      },
    });

    const pruner = new ImagePruner(config, openshiftClient);
    await pruner.run();
  } catch (error: unknown) {
    console.error("Image tag pruning failed:", error);
    process.exit(1);
  }
})();
