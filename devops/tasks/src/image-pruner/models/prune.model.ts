/**
 * An environment checked for currently deployed images. The namespace is explicit because
 * some environments (e.g. a shared staging cluster) are hosted under a different license
 * plate than the rest of the environments.
 */
export interface PruneEnvironment {
  name: string;
  namespace: string;
}

export interface PruneConfig {
  saToken: string;
  openShiftUrl: string;
  licensePlate: string;
  environments: PruneEnvironment[];
  applications: string[];
  ocJobs: string[];
  prefix: string;
  minTags: number;
  minReleaseVersions: number;
  dryRun: boolean;
  toolsNamespace: string;
}
