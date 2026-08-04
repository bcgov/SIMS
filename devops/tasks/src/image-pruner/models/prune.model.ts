export interface PruneConfig {
  saToken: string;
  openShiftUrl: string;
  licensePlate: string;
  environment: string;
  applications: string[];
  ocJobs: string[];
  prefix: string;
  minTags: number;
  dryRun: boolean;
  toolsNamespace: string;
  appNamespace: string;
}
