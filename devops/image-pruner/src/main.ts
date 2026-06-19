import { config as loadDotEnv } from "dotenv";
import type { PruneConfig } from "./models/prune.model";
import { createOpenShiftClient } from "./clients/openshift.client";
import { initializePruner, pruneDeploymentApp, pruneJobApp } from "./pruner";

loadDotEnv();

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

  const dryRun = !process.argv.includes("--confirm");

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
    minTags: (() => {
      const parsed = Number.parseInt(process.env.MIN_TAGS ?? "2", 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        throw new Error(
          `MIN_TAGS must be a non-negative integer. Got: ${process.env.MIN_TAGS}.`,
        );
      }
      return parsed;
    })(),
    dryRun,
  };
}

/**
 * Script main execution method.
 */
(async () => {
  try {
    const config = loadConfig();
    const client = await createOpenShiftClient(config);
    initializePruner(client, config);

    console.log("Starting image tag pruning...");
    console.table([
      {
        environment: config.environment,
        licensePlate: config.licensePlate,
        applications: config.applications.join(", "),
        jobs: config.ocJobs.join(", "),
        tagPrefix: config.prefix,
        minPrefixTags: config.minTags,
        dryRun: config.dryRun,
      },
    ]);

    // Prune image tags for each application (api-sims, web-app, queue-consumers, etc.).
    for (const application of config.applications) {
      await pruneDeploymentApp(application);
    }

    // Prune image tags for each oc job (e.g. migration-job).
    for (const job of config.ocJobs) {
      await pruneJobApp(job);
    }

    console.log("\n" + "=".repeat(80));
    console.log(
      `Image tag pruning completed. ${config.dryRun ? "DRY RUN - NO CHANGES WERE MADE TO THE CLUSTER!" : ""}`,
    );
    console.log("\n" + "=".repeat(80));
  } catch (error: unknown) {
    console.error("Image tag pruning failed:", error);
    process.exit(1);
  }
})();
