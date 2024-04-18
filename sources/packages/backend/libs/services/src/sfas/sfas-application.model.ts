/**
 * Represents the SFAS/SAIL application awards.
 */
export interface SFASApplicationAwards {
  CSGP: number;
  SBSD: number;
  CSGD: number;
  BCAG: number;
  CSPT?: number;
}

/**
 * SFAS/SAIL application awards keys.
 */
export enum SFASApplicationAwardsEnum {
  CSGP = "CSGP",
  SBSD = "SBSD",
  CSPT = "CSPT",
  CSGD = "CSGD",
  BCAG = "BCAG",
}
