export class IER12IntegrationQueueInDTO {
  /**
   * Include modifications to IER12 related data made since this date (inclusive). If not provided, it will default to the previous day. The date should be in ISO format (YYYY-MM-DD).
   */
  modifiedSince?: string;
  /**
   * Institution code to limit applications to a specific institution.
   */
  institutionCode?: string;
}
