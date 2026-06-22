import { config as loadDotEnv } from "dotenv";
import { OpenshiftClient } from "./clients/openshift.client.ts";
import { ImagePruner } from "./pruner.ts";
import type { PruneConfig } from "./models/prune.model.ts";

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
  console.error("Image tag pruning failed:", error);
  process.exit(1);
}
