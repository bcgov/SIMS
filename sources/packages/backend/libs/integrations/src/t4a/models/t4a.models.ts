/**
 * T4A information extracted from the file path and name.
 */
export interface T4AFileInfo {
  /**
   * T4A file directory on the SFTP.
   * Files are expected to be in directories named after the year
   * the T4A is for, e.g., 2022, 2023.
   */
  directory: string;
  /**
   * File extension including the dot, likely `.pdf`.
   */
  fileExtension: string;
  /**
   * Full remote file path including the file name on the SFTP.
   */
  remoteFileFullPath: string;
  /**
   * SIN number extracted from the file name.
   */
  sin: string;
}
