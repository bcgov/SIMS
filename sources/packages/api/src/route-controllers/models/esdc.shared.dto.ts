/**
 * Shared DTO for EDSC file processing API response.
 * TODO: Other esdc file processing services must eventually use this DTO.
 */
export class ESDCFileResponseAPIOutDTO {
  processSummary: string[];
  errorsSummary: string[];
}
