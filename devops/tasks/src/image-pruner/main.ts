import { config as loadDotEnv } from "dotenv";
import { OpenshiftClient } from "../clients/openshift.client";
import { ImagePruner } from "./pruner";
import type { PruneConfig, PruneEnvironment } from "./models/prune.model";

const DEFAULT_APPLICATIONS = [
  "web-sims",
  "api-sims",
  "queue-consumers-sims",
  "workers-sims",
];
const DEFAULT_OC_JOBS = ["migrations-job"];
const DEFAULT_PREFIX = "main";
const DEFAULT_MIN_TAGS = 2;
const DEFAULT_MIN_RELEASE_VERSIONS = 4;

/**
 * Builds the list of environments checked for currently deployed images. Staging is a
 * separate environment hosted under its own license plate instead of following the
 * `${licensePlate}-${environment}` namespace convention used by the other environments.
 * @param licensePlate The license plate used to compose the default namespaces.
 * @param stagingLicensePlate The license plate used to compose the staging namespace.
 * @returns The environments to check, in order.
 */
function getEnvironments(
  licensePlate: string,
  stagingLicensePlate: string,
): PruneEnvironment[] {
  return [
    { name: "dev", namespace: `${licensePlate}-dev` },
    { name: "test", namespace: `${licensePlate}-test` },
    { name: "stg", namespace: `${stagingLicensePlate}-test` },
    { name: "prod", namespace: `${licensePlate}-prod` },
  ];
}

/**
 * Loads and validates the pruner configuration from environment variables and command line arguments.
 * @returns The validated prune configuration.
 */
function loadConfig(): PruneConfig {
  const saToken = process.env.SA_TOKEN;
  const openShiftUrl = process.env.OPENSHIFT_URL?.replace(/\/$/, "");
  const licensePlate = process.env.LICENSE_PLATE;
  const stagingLicensePlate = process.env.STAGING_LICENSE_PLATE;

  if (!saToken) {
    throw new Error("Missing required environment variable: SA_TOKEN.");
  }
  if (!openShiftUrl) {
    throw new Error("Missing required environment variable: OPENSHIFT_URL.");
  }
  if (!licensePlate) {
    throw new Error("Missing required environment variable: LICENSE_PLATE.");
  }
  if (!stagingLicensePlate) {
    throw new Error(
      "Missing required environment variable: STAGING_LICENSE_PLATE.",
    );
  }

  return {
    saToken,
    openShiftUrl,
    licensePlate,
    toolsNamespace: `${licensePlate}-tools`,
    environments: getEnvironments(licensePlate, stagingLicensePlate),
    applications: DEFAULT_APPLICATIONS,
    ocJobs: DEFAULT_OC_JOBS,
    prefix: DEFAULT_PREFIX,
    minTags: DEFAULT_MIN_TAGS,
    minReleaseVersions: DEFAULT_MIN_RELEASE_VERSIONS,
    dryRun: !process.argv.includes("--confirm"),
  };
}

/**
 * Script main execution method.
 */
try {
  loadDotEnv();

  const config = loadConfig();
  const openshiftClient = await OpenshiftClient.create({
    config: {
      openShiftUrl: config.openShiftUrl,
      licensePlate: config.licensePlate,
      saToken: config.saToken,
    },
  });

  const pruner = new ImagePruner(config, openshiftClient);
  await pruner.pruneImages();
} catch (error: unknown) {
  throw new Error("Image tag pruning failed", { cause: error });
}
