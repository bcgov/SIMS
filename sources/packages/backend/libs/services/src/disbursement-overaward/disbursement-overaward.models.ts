/**
 * Total overawards balances per awards.
 * @example
 * {
 *    CSLF: 5532,
 *    BCSL: 1256,
 * }
 */
export type AwardOverawardBalance = Record<string, number>;

/**
 * Total overawards balances per awards indexed per student id.
 * @example considering 123 and 456 as students ids.
 * 123: {
 *    CSLF: 659,
 *    BCSL: 6565,
 * },
 * 456: {
 *    CSLF: 9898,
 * },
 */
export interface StudentOverawardBalance {
  [studentId: number]: AwardOverawardBalance | undefined;
}
