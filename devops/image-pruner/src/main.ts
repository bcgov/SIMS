import { config as loadDotEnv } from "dotenv";
import { OpenshiftClient } from "./clients/openshift.client";
import { ImagePruner } from "./pruner";
import type { PruneConfig } from "./models/prune.model";

const DEFAULT_ENVIRONMENT = "dev";
const DEFAULT_APPLICATIONS = [
  "web-sims",
  "api-sims",
  "queue-consumers-sims",
  "workers-sims",
];
const DEFAULT_OC_JOBS = ["migrations-job"];
const DEFAULT_PREFIX = "main";
const DEFAULT_MIN_TAGS = 2;

/**
 * Loads and validates the pruner configuration from environment variables and command line arguments.
 * @returns The validated prune configuration.
 */
function loadConfig(): PruneConfig {
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

  return {
    saToken,
    openShiftUrl,
    licensePlate,
    toolsNamespace: `${licensePlate}-tools`,
    appNamespace: `${licensePlate}-${DEFAULT_ENVIRONMENT}`,
    environment: DEFAULT_ENVIRONMENT,
    applications: DEFAULT_APPLICATIONS,
    ocJobs: DEFAULT_OC_JOBS,
    prefix: DEFAULT_PREFIX,
    minTags: DEFAULT_MIN_TAGS,
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
