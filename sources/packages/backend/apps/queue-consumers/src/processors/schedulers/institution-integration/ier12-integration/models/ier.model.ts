export class IER12IntegrationQueueInDTO {
  /**
   * Inclusive date since the application or student data was modified. If not provided, it will default to the previous day. The date should be in ISO format (YYYY-MM-DD).
   */
  modifiedSince?: string;
  /**
   * Institution code to limit applications to a specific institution.
   */
  institutionCode?: string;
}
